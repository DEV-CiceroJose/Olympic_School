import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { computeAssessmentReport } from "./assessment-logic.js";

initializeApp();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10 });
const db = getFirestore("biodoraia");
const classes = new Set([
  "1º DSA",
  "1º DSB",
  "1º TETA",
  "1º TETB",
  "2º DSA",
  "2º DSB",
  "2º TETA",
  "2º TETB",
  "3º DSA",
  "3º DSB",
  "3º TETA",
  "3º TETB",
]);

function authenticated(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Faça login novamente.");
  return request.auth;
}

async function loadReportData(session) {
  const reference = db.collection("assessmentDefinitions").doc(session.assessmentId);
  const [questions, keys, responses] = await Promise.all([
    reference.collection("questions").orderBy("order").get(),
    reference.collection("answerKeys").get(),
    db.collection("assessmentSessions").doc(session.id).collection("responses").get(),
  ]);
  return {
    questions: questions.docs.map((item) => ({ id: item.id, ...item.data() })),
    answerKeys: keys.docs.map((item) => ({ id: item.id, ...item.data() })),
    responses: responses.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}

async function completeSession(reference, { requireMinimum = false } = {}) {
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Tentativa não encontrada.");
  const session = { id: snapshot.id, ...snapshot.data() };
  if (session.status === "completed") return session;
  const now = Timestamp.now();
  if (requireMinimum && now.toMillis() < session.earliestSubmitAt.toMillis()) {
    throw new HttpsError("failed-precondition", "A entrega só é liberada após 30 minutos.");
  }
  const data = await loadReportData(session);
  const report = computeAssessmentReport({ session, ...data, completedAt: now });
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    if (current.data()?.status !== "in_progress") return;
    transaction.update(reference, {
      status: "completed",
      completedAt: now,
      report,
      updatedAt: now,
    });
  });
  return { ...session, status: "completed", completedAt: now, report };
}

export const startAssessment = onCall(async (request) => {
  const identity = authenticated(request);
  const { assessmentId, assessmentType, className } = request.data ?? {};
  if (!classes.has(className))
    throw new HttpsError("invalid-argument", "Selecione uma turma válida.");
  if (!["diagnostico_inicial", "diagnostico_final"].includes(assessmentType))
    throw new HttpsError("invalid-argument", "Tipo inválido.");
  const definition = await db.collection("assessmentDefinitions").doc(assessmentId).get();
  if (
    !definition.exists ||
    !definition.data().isActive ||
    definition.data().type !== assessmentType
  )
    throw new HttpsError("failed-precondition", "Esta avaliação não está disponível.");
  const reference = db.collection("assessmentSessions").doc(`${identity.uid}_${assessmentType}`);
  const existing = await reference.get();
  if (existing.exists) return { id: existing.id, ...existing.data(), resumed: true };
  const [profile, now] = await Promise.all([
    db.collection("users").doc(identity.uid).get(),
    Promise.resolve(Timestamp.now()),
  ]);
  const assessment = definition.data();
  const session = {
    userId: identity.uid,
    studentName: profile.data()?.name || identity.token.name || "Estudante",
    studentEmail: profile.data()?.email || identity.token.email || "",
    className,
    assessmentId,
    assessmentTitle: assessment.title,
    assessmentType,
    assessmentVersion: assessment.version,
    questionIds: assessment.questionIds,
    questionCount: assessment.questionCount,
    answeredCount: 0,
    status: "in_progress",
    startedAt: now,
    earliestSubmitAt: Timestamp.fromMillis(now.toMillis() + assessment.minMinutes * 60_000),
    deadlineAt: Timestamp.fromMillis(now.toMillis() + assessment.maxMinutes * 60_000),
    createdAt: now,
    updatedAt: now,
  };
  try {
    await reference.create(session);
  } catch (error) {
    if (error.code !== 6 && error.code !== "already-exists") throw error;
  }
  return { id: reference.id, ...session, resumed: false };
});

export const submitAssessmentAnswer = onCall(async (request) => {
  const identity = authenticated(request);
  const { sessionId, questionId, selectedOption } = request.data ?? {};
  if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 5)
    throw new HttpsError("invalid-argument", "Alternativa inválida.");
  const sessionRef = db.collection("assessmentSessions").doc(sessionId);
  const responseRef = sessionRef.collection("responses").doc(questionId);
  await db.runTransaction(async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists || sessionSnapshot.data().userId !== identity.uid)
      throw new HttpsError("permission-denied", "Tentativa inválida.");
    const session = sessionSnapshot.data();
    if (
      session.status !== "in_progress" ||
      Timestamp.now().toMillis() >= session.deadlineAt.toMillis()
    )
      throw new HttpsError("failed-precondition", "O prazo desta avaliação terminou.");
    if (!session.questionIds.includes(questionId))
      throw new HttpsError("invalid-argument", "Questão inválida.");
    const [question, response] = await Promise.all([
      transaction.get(
        db
          .collection("assessmentDefinitions")
          .doc(session.assessmentId)
          .collection("questions")
          .doc(questionId),
      ),
      transaction.get(responseRef),
    ]);
    if (!question.exists || selectedOption >= question.data().options.length)
      throw new HttpsError("invalid-argument", "Alternativa inválida.");
    if (response.exists) throw new HttpsError("already-exists", "Esta resposta já foi confirmada.");
    const now = Timestamp.now();
    transaction.create(responseRef, { questionId, selectedOption, answeredAt: now });
    transaction.update(sessionRef, { answeredCount: FieldValue.increment(1), updatedAt: now });
  });
  return { saved: true };
});

export const finalizeAssessment = onCall(async (request) => {
  const identity = authenticated(request);
  const reference = db.collection("assessmentSessions").doc(request.data?.sessionId);
  const snapshot = await reference.get();
  if (
    !snapshot.exists ||
    (snapshot.data().userId !== identity.uid && identity.token.teacher !== true)
  )
    throw new HttpsError("permission-denied", "Tentativa inválida.");
  return completeSession(reference, { requireMinimum: snapshot.data().userId === identity.uid });
});

export const finalizeExpiredAssessments = onSchedule("every 5 minutes", async () => {
  const expired = await db
    .collection("assessmentSessions")
    .where("status", "==", "in_progress")
    .where("deadlineAt", "<=", Timestamp.now())
    .limit(100)
    .get();
  await Promise.all(expired.docs.map((item) => completeSession(item.ref)));
});
