import {
  assessmentSessionId,
  canSubmitAssessment,
  computeAssessmentReport,
  earliestAssessmentSubmission,
  validAssessmentStart,
} from "../functions/assessment-logic.js";

export class AssessmentError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const series = /^([123])(?:º|°)?\s+(DSA|DSB|TETA|TETB)$/i;
const safeId = (value) => typeof value === "string" && /^[\w-]{1,266}$/.test(value);
const sessionPath = (id) => `assessmentSessions/${id}`;
const definitionPath = (id) => `assessmentDefinitions/${id}`;
const conflict = (error) =>
  ["ABORTED", "FAILED_PRECONDITION", "ALREADY_EXISTS"].includes(error.code);

function schoolClass(value) {
  const parts = typeof value === "string" && value.trim().match(series);
  return parts ? `${parts[1]}º ${parts[2].toUpperCase()}` : null;
}

function ownedSession(snapshot, identity, teacherAllowed = false) {
  if (
    !snapshot ||
    (snapshot.data.userId !== identity.sub && !(teacherAllowed && identity.teacher === true))
  ) {
    throw new AssessmentError("permission-denied", "Tentativa inválida.");
  }
  return snapshot.data;
}

async function updateSession(store, id, operation) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const snapshot = await store.get(sessionPath(id));
    try {
      return await operation(snapshot);
    } catch (error) {
      if (!conflict(error)) throw error;
    }
  }
  throw new AssessmentError("aborted", "A tentativa foi atualizada. Tente novamente.");
}

export async function startAssessment(store, identity, input, now = new Date()) {
  const { assessmentId, assessmentType } = input;
  if (!validAssessmentStart(assessmentId, assessmentType)) {
    throw new AssessmentError("invalid-argument", "Avaliação inválida.");
  }
  const id = assessmentSessionId(identity.sub, assessmentType, assessmentId);
  const existing = await store.get(sessionPath(id));
  if (existing) {
    ownedSession(existing, identity);
    return { id, resumed: true };
  }
  const [definition, profile] = await Promise.all([
    store.get(definitionPath(assessmentId)),
    store.get(`users/${identity.sub}`, ["name", "email", "turma", "profileCompleted"]),
  ]);
  const assessment = definition?.data;
  if (!assessment?.isActive || assessment.type !== assessmentType) {
    throw new AssessmentError("failed-precondition", "Esta avaliação não está disponível.");
  }
  const className = schoolClass(profile?.data.turma);
  if (!profile?.data.profileCompleted || !className) {
    throw new AssessmentError("failed-precondition", "Atualize a turma no seu cadastro.");
  }
  try {
    await store.commit([
      {
        path: sessionPath(id),
        fields: {
          userId: identity.sub,
          studentName: profile.data.name || identity.name || "Estudante",
          studentEmail: profile.data.email || identity.email || "",
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
          earliestSubmitAt: new Date(earliestAssessmentSubmission(now, assessment)),
          deadlineAt: new Date(now.getTime() + assessment.maxMinutes * 60_000),
          createdAt: now,
          updatedAt: now,
        },
      },
    ]);
  } catch (error) {
    if (!conflict(error)) throw error;
    ownedSession(await store.get(sessionPath(id)), identity);
    return { id, resumed: true };
  }
  return { id, resumed: false };
}

export async function submitAssessmentAnswer(store, identity, input, clock = () => new Date()) {
  const { sessionId, questionId, selectedOption } = input;
  if (
    !safeId(sessionId) ||
    !safeId(questionId) ||
    !Number.isInteger(selectedOption) ||
    selectedOption < 0 ||
    selectedOption > 5
  ) {
    throw new AssessmentError("invalid-argument", "Questão ou alternativa inválida.");
  }
  return updateSession(store, sessionId, async (snapshot) => {
    const session = ownedSession(snapshot, identity);
    if (session.status !== "in_progress" || clock() >= session.deadlineAt) {
      throw new AssessmentError("failed-precondition", "O prazo desta avaliação terminou.");
    }
    if (!session.questionIds.includes(questionId)) {
      throw new AssessmentError("invalid-argument", "Questão inválida.");
    }
    const path = `${sessionPath(sessionId)}/responses/${questionId}`;
    const [question, response] = await Promise.all([
      store.get(`${definitionPath(session.assessmentId)}/questions/${questionId}`, ["options"]),
      store.get(path, ["selectedOption"]),
    ]);
    if (!question || selectedOption >= question.data.options.length) {
      throw new AssessmentError("invalid-argument", "Alternativa inválida.");
    }
    if (response) {
      if (response.data.selectedOption === selectedOption) return { saved: true };
      throw new AssessmentError("already-exists", "Esta resposta já foi confirmada.");
    }
    const answeredAt = clock();
    if (answeredAt >= session.deadlineAt) {
      throw new AssessmentError("failed-precondition", "O prazo desta avaliação terminou.");
    }
    await store.commit([
      { path, fields: { questionId, selectedOption, answeredAt } },
      {
        path: sessionPath(sessionId),
        updateTime: snapshot.updateTime,
        fields: { answeredCount: session.answeredCount + 1, updatedAt: answeredAt },
      },
    ]);
    return { saved: true };
  });
}

function withId({ id, data }) {
  return { ...data, id };
}

async function completeSession(store, sessionId, identity, clock) {
  return updateSession(store, sessionId, async (snapshot) => {
    if (!identity && !snapshot) return;
    const session = identity ? ownedSession(snapshot, identity, true) : snapshot.data;
    if (session.status === "completed") return { completed: true };
    const completedAt = clock();
    if (!identity && completedAt < session.deadlineAt) return;
    if (!canSubmitAssessment(session, completedAt)) {
      throw new AssessmentError("failed-precondition", "Aguarde o tempo mínimo para entregar.");
    }

    const path = definitionPath(session.assessmentId);
    const [questions, answerKeys, responses] = await Promise.all([
      store.getMany(
        session.questionIds.map((id) => `${path}/questions/${id}`),
        [
          "order",
          "area",
          "skillId",
          "skillLabel",
          "prompt",
          "examYear",
          "originalNumber",
          "options",
        ],
      ),
      store.getMany(
        session.questionIds.map((id) => `${path}/answerKeys/${id}`),
        ["correctOption", "explanation"],
      ),
      store.getMany(
        session.questionIds.map((id) => `${sessionPath(sessionId)}/responses/${id}`),
        ["questionId", "selectedOption"],
      ),
    ]);
    if (questions.length !== session.questionIds.length || answerKeys.length !== questions.length) {
      throw new Error("Incomplete assessment for report");
    }
    const report = computeAssessmentReport({
      session,
      questions: questions.map(withId).sort((left, right) => left.order - right.order),
      answerKeys: answerKeys.map(withId),
      responses: responses.map(withId),
      completedAt,
    });
    await store.commit([
      {
        path: sessionPath(sessionId),
        updateTime: snapshot.updateTime,
        fields: { status: "completed", completedAt, report, updatedAt: completedAt },
      },
    ]);
    return { completed: true };
  });
}

export async function finalizeAssessment(store, identity, input, clock = () => new Date()) {
  if (!safeId(input.sessionId))
    throw new AssessmentError("invalid-argument", "Tentativa inválida.");
  return completeSession(store, input.sessionId, identity, clock);
}

export async function finalizeExpiredAssessments(store, clock = () => new Date()) {
  const expired = await store.expired(clock(), 8);
  const outcomes = await Promise.allSettled(
    expired.map(({ id }) => completeSession(store, id, null, clock)),
  );
  if (outcomes.some((outcome) => outcome.status === "rejected")) {
    throw new Error("One or more expired assessments could not be finalized");
  }
}
