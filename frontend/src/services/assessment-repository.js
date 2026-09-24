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
    const result = await startAssessmentCall(input);
    return result.data;
  },
  async answer(input) {
    const result = await submitAnswerCall(input);
    return result.data;
  },
  async finalize(sessionId) {
    const result = await finalizeAssessmentCall({ sessionId });
    return result.data;
  },
};
