import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { StudyPlan } from "@/domain/study-plan";
import { auth, db } from "@/lib/firebase";

function currentUid() {
  const value = auth.currentUser?.uid;
  if (!value) throw new Error("Faça login para acessar seus planos.");
  return value;
}

function planData(plan: StudyPlan) {
  const data: Record<string, unknown> = {
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

export const studyPlanRepository = {
  async list(): Promise<StudyPlan[]> {
    const userId = currentUid();
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "studyPlans"), orderBy("createdAt", "desc")),
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
      } as StudyPlan;
    });
  },

  async save(plan: StudyPlan): Promise<void> {
    const userId = currentUid();
    await setDoc(doc(db, "users", userId, "studyPlans", plan.id), {
      ...planData(plan),
      createdAt: serverTimestamp(),
    });
  },

  async toggleSession(plan: StudyPlan, sessionId: string): Promise<StudyPlan> {
    const userId = currentUid();
    const updated = {
      ...plan,
      sessions: plan.sessions.map((session) =>
        session.id === sessionId ? { ...session, completed: !session.completed } : session,
      ),
    };
    await updateDoc(doc(db, "users", userId, "studyPlans", plan.id), planData(updated));
    return updated;
  },
};
