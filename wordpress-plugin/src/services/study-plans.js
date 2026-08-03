import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

function context() {
  const { auth, db } = getFirebaseRuntime();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return { db, uid };
}

function planData(plan) {
  const data = {
    title: plan.objective.slice(0, 160),
    targetOlympiad: plan.input.targetOlympiad,
    availableDays: plan.input.availableDays,
    minutesPerDay: plan.input.minutesPerDay,
    priorityTopics: plan.input.priorityTopics ?? [],
    sessions: plan.sessions,
    updatedAt: serverTimestamp(),
  };
  if (plan.input.examDate) data.examDate = plan.input.examDate;
  return data;
}

export const studyPlanRepository = Object.freeze({
  async list() {
    const { db, uid } = context();
    const snapshot = await getDocs(
      query(collection(db, "users", uid, "studyPlans"), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        objective: data.title,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        input: {
          targetOlympiad: data.targetOlympiad,
          examDate: data.examDate,
          availableDays: data.availableDays,
          minutesPerDay: data.minutesPerDay,
          priorityTopics: data.priorityTopics,
        },
        sessions: data.sessions,
      };
    });
  },

  async save(plan) {
    const { db, uid } = context();
    await setDoc(doc(db, "users", uid, "studyPlans", plan.id), {
      ...planData(plan),
      createdAt: serverTimestamp(),
    });
  },

  async toggleSession(plan, sessionId) {
    const { db, uid } = context();
    const updated = {
      ...plan,
      sessions: plan.sessions.map((session) =>
        session.id === sessionId ? { ...session, completed: !session.completed } : session,
      ),
    };
    await updateDoc(doc(db, "users", uid, "studyPlans", plan.id), planData(updated));
    return updated;
  },

  async remove(id) {
    const { db, uid } = context();
    await deleteDoc(doc(db, "users", uid, "studyPlans", id));
  },
});
