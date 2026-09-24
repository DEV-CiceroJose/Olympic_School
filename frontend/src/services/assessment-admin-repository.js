import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const normalize = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

export const assessmentAdminRepository = {
  async publish({ assessment, questions }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Faça login novamente.");
    const reference = doc(db, "assessmentDefinitions", assessment.id);
    if ((await getDoc(reference)).exists()) {
      throw new Error(
        "Este código de avaliação já existe. Altere o código ou a versão na planilha.",
      );
    }
    const active = await getDocs(
      query(
        collection(db, "assessmentDefinitions"),
        where("type", "==", assessment.type),
        where("isActive", "==", true),
        limit(10),
      ),
    );
    const batch = writeBatch(db);
    if (assessment.isActive) {
      active.forEach((item) =>
        batch.update(item.ref, { isActive: false, updatedAt: serverTimestamp() }),
      );
    }
    batch.set(reference, {
      ...assessment,
      questionIds: questions.map((item) => item.id),
      source: "xlsx",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    for (const question of questions) {
      const {
        correctOption,
        explanation,
        assessmentId: _assessmentId,
        ...publicQuestion
      } = question;
      batch.set(doc(reference, "questions", question.id), {
        ...publicQuestion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(reference, "answerKeys", question.id), {
        correctOption,
        explanation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return assessment;
  },
  async definitions() {
    const snapshot = await getDocs(
      query(collection(db, "assessmentDefinitions"), orderBy("createdAt", "desc"), limit(100)),
    );
    return snapshot.docs.map(normalize);
  },
  async sessions() {
    const snapshot = await getDocs(
      query(collection(db, "assessmentSessions"), orderBy("startedAt", "desc"), limit(500)),
    );
    return snapshot.docs.map(normalize);
  },
};
