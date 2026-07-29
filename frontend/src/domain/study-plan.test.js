import { describe, expect, it } from "vitest";
import { generateStudyPlan } from "./study-plan";
const mastery = [
  {
    skillId: "estrutura_celular",
    label: "Estrutura celular",
    score: 80,
    attempts: 4,
    correctAttempts: 3,
    confidence: "medium",
  },
  {
    skillId: "relacoes_ecologicas",
    label: "Relações ecológicas",
    score: 20,
    attempts: 4,
    correctAttempts: 1,
    confidence: "medium",
  },
];
describe("study plan generator", () => {
  it("prioritizes the weakest recorded skill", () => {
    const plan = generateStudyPlan(
      "plan-1",
      "2026-07-29T00:00:00.000Z",
      {
        targetOlympiad: "OBB",
        availableDays: ["Terça", "Sábado"],
        minutesPerDay: 45,
      },
      mastery,
    );
    expect(plan.sessions[0].topic).toBe("Relações ecológicas");
    expect(plan.sessions).toHaveLength(6);
    expect(plan.sessions.at(-1)?.activity).toBe("simulation");
  });
  it("keeps explicit priorities before mastery topics", () => {
    const plan = generateStudyPlan(
      "plan-2",
      "2026-07-29T00:00:00.000Z",
      {
        targetOlympiad: "TNBIO",
        availableDays: ["Domingo"],
        minutesPerDay: 60,
        priorityTopics: ["Botânica"],
      },
      mastery,
    );
    expect(plan.sessions[0].topic).toBe("Botânica");
    expect(plan.sessions.every((session) => session.minutes === 60)).toBe(true);
  });
});
