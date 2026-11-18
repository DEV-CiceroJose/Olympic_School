import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";

function requireUser() {
  if (!auth.currentUser) throw new Error("Faça login para acessar a avaliação.");
  return auth.currentUser;
}

function withId(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

const startAssessmentCall = httpsCallable(functions, "startAssessment");
const submitAnswerCall = httpsCallable(functions, "submitAssessmentAnswer");
const finalizeAssessmentCall = httpsCallable(functions, "finalizeAssessment");

const workerUrl = import.meta.env.VITE_ASSESSMENT_API_URL?.replace(/\/+$/, "");

async function callAssessment(path, callable, input) {
  if (!workerUrl) return (await callable(input)).data;
  const token = await requireUser().getIdToken();
  let response;
  try {
    response = await fetch(`${workerUrl}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    const error = new Error("O serviço de diagnóstico está indisponível.");
    error.code = "functions/unavailable";
    throw error;
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.data) {
    const error = new Error(
      result?.error?.message || "O serviço de diagnóstico está indisponível.",
    );
    error.code = `functions/${result?.error?.code || "unavailable"}`;
    throw error;
  }
  return result.data;
}

export const assessmentRepository = {
  async activeDefinition(type = "diagnostico_inicial") {
    const snapshot = await getDocs(
      query(
        collection(db, "assessmentDefinitions"),
        where("type", "==", type),
        where("isActive", "==", true),
        limit(1),
      ),
    );
    return snapshot.empty ? null : withId(snapshot.docs[0]);
  },
  async questions(assessmentId) {
    const snapshot = await getDocs(
      query(
        collection(db, "assessmentDefinitions", assessmentId, "questions"),
        orderBy("order", "asc"),
      ),
    );
    return snapshot.docs.map(withId);
  },
  async session(type = "diagnostico_inicial") {
    const user = requireUser();
    const snapshot = await getDoc(doc(db, "assessmentSessions", `${user.uid}_${type}`));
    return snapshot.exists() ? withId(snapshot) : null;
  },
  async responses(sessionId) {
    const snapshot = await getDocs(
      query(collection(db, "assessmentSessions", sessionId, "responses"), orderBy("answeredAt")),
    );
    return snapshot.docs.map(withId);
  },
  async start(input) {
    return callAssessment("start", startAssessmentCall, input);
  },
  async answer(input) {
    return callAssessment("answer", submitAnswerCall, input);
  },
  async finalize(sessionId) {
    return callAssessment("finalize", finalizeAssessmentCall, { sessionId });
  },
};
