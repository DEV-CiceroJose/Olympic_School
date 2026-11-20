import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const normalize = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const duplicateCode = () =>
  new Error("Este código de avaliação já existe. Use outro código para publicar uma nova versão.");

export const assessmentAdminRepository = {
  async publish({ assessment, questions }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Faça login novamente.");
    const reference = doc(db, "assessmentDefinitions", assessment.id);
    const activeReference = doc(db, "activeAssessments", assessment.type);
    let observedActiveId;
    const publishTransaction = async (transaction) => {
      if ((await transaction.get(reference)).exists()) throw duplicateCode();
      if (assessment.isActive) {
        // Every active publication reads and writes this document. Firestore retries
        // the transaction if another publication changes it before the commit.
        const active = await transaction.get(activeReference);
        observedActiveId = active.data()?.assessmentId;
        // On the first publication for a type, reconcile all legacy active versions.
        const previousReferences = observedActiveId
          ? [doc(db, "assessmentDefinitions", observedActiveId)]
          : (
              await getDocsFromServer(
                query(
                  collection(db, "assessmentDefinitions"),
                  where("type", "==", assessment.type),
                  where("isActive", "==", true),
                ),
              )
            ).docs.map((item) => item.ref);
        for (const previous of previousReferences) {
          transaction.update(previous, { isActive: false, updatedAt: serverTimestamp() });
        }
        transaction.set(activeReference, { assessmentId: assessment.id });
      }

      transaction.set(reference, {
        ...assessment,
        questionIds: questions.map((item) => item.id),
        source: "csv",
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
        transaction.set(doc(reference, "questions", question.id), {
          ...publicQuestion,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(doc(reference, "answerKeys", question.id), {
          correctOption,
          explanation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    };

    for (let attempt = 0; ; attempt += 1) {
      try {
        await runTransaction(db, publishTransaction);
        return assessment;
      } catch (error) {
        // Rules may reject a stale write before Firestore reports the transaction conflict.
        if (error.code !== "permission-denied") throw error;
        if ((await getDocFromServer(reference)).exists()) throw duplicateCode();
        if (!assessment.isActive || attempt >= 2) throw error;
        const current = await getDocFromServer(activeReference);
        if (current.data()?.assessmentId === observedActiveId) throw error;
      }
    }
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
