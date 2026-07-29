import type { StudyPlan } from "@/domain/study-plan";

const KEY = "biodoraia.study-plans";

function read(): StudyPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as StudyPlan[];
  } catch {
    return [];
  }
}

function write(plans: StudyPlan[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(plans));
}

export const studyPlanRepository = {
  list: read,
  save(plan: StudyPlan) {
    const plans = read().filter((item) => item.id !== plan.id);
    write([plan, ...plans]);
  },
  toggleSession(planId: string, sessionId: string) {
    const plans = read().map((plan) =>
      plan.id !== planId
        ? plan
        : {
            ...plan,
            sessions: plan.sessions.map((session) =>
              session.id === sessionId ? { ...session, completed: !session.completed } : session,
            ),
          },
    );
    write(plans);
    return plans.find((plan) => plan.id === planId);
  },
};
