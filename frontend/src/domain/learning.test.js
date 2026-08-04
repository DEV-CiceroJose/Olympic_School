import { describe, expect, it } from "vitest";
import {
  confidenceFor,
  adaptiveReasonFor,
  diagnosticAreaResults,
  diagnosticPercentage,
  diagnosticRecommendations,
  masteryFromDiagnostic,
  masteryLevel,
  selectNextQuestion,
  updateMastery,
} from "./learning";
import { diagnosticQuestions } from "../data/diagnostic-questions";
const attempt = (overrides = {}) => ({
  id: "attempt-1",
  questionId: "cell-01",
  skillId: "estrutura_celular",
  selectedOption: 1,
  correct: true,
  difficulty: 1,
  responseTimeMs: 2_000,
  answeredAt: "2026-07-29T12:00:00.000Z",
  errorType: null,
  ...overrides,
});
const mastery = {
  skillId: "estrutura_celular",
  label: "Estrutura celular",
  score: 50,
  attempts: 3,
  correctAttempts: 2,
  confidence: "low",
};
describe("learning domain", () => {
  it("classifies mastery boundaries deterministically", () => {
    expect(masteryLevel(24)).toBe("Lacuna crítica");
    expect(masteryLevel(25)).toBe("Domínio baixo");
    expect(masteryLevel(50)).toBe("Domínio intermediário");
    expect(masteryLevel(80)).toBe("Domínio alto");
  });
  it("raises mastery after a correct answer and confidence after four attempts", () => {
    const result = updateMastery(mastery, attempt());
    expect(result.score).toBe(56);
    expect(result.attempts).toBe(4);
    expect(result.correctAttempts).toBe(3);
    expect(result.confidence).toBe("medium");
  });
  it("lowers mastery after an error without falling below zero", () => {
    const result = updateMastery(
      { ...mastery, score: 2 },
      attempt({ correct: false, selectedOption: 0, errorType: "conceptual" }),
    );
    expect(result.score).toBe(0);
  });
  it("builds diagnostic mastery from real attempts", () => {
    const questions = diagnosticQuestions.slice(0, 3);
    const attempts = [
      attempt(),
      attempt({
        id: "attempt-2",
        questionId: "cell-02",
        skillId: "metabolismo",
        correct: false,
        errorType: "conceptual",
      }),
      attempt({
        id: "attempt-3",
        questionId: "gen-01",
        skillId: "probabilidade_genetica",
      }),
    ];
    const result = masteryFromDiagnostic(questions, attempts);
    expect(result.find((item) => item.skillId === "estrutura_celular")?.score).toBe(100);
    expect(result.find((item) => item.skillId === "metabolismo")?.score).toBe(0);
    expect(diagnosticPercentage(attempts)).toBe(67);
  });
  it("selects an introductory question for the weakest skill", () => {
    const selected = selectNextQuestion(
      diagnosticQuestions,
      [
        { ...mastery, score: 90 },
        {
          ...mastery,
          skillId: "relacoes_ecologicas",
          label: "Relações ecológicas",
          score: 10,
        },
      ],
      [],
    );
    expect(selected.skillId).not.toBe("estrutura_celular");
    expect(selected.difficulty).toBe(1);
  });
  it("maps confidence to evidence volume", () => {
    expect(confidenceFor(3)).toBe("low");
    expect(confidenceFor(4)).toBe("medium");
    expect(confidenceFor(8)).toBe("high");
  });
  it("prioritizes a topic selected in the current study plan", () => {
    const questions = [
      { ...diagnosticQuestions[2], id: "gen-priority", difficulty: 2 },
      { ...diagnosticQuestions[6], id: "eco-priority", difficulty: 2 },
    ];
    const selected = selectNextQuestion(
      questions,
      [
        { ...mastery, skillId: questions[0].skillId, score: 50 },
        { ...mastery, skillId: questions[1].skillId, score: 50 },
      ],
      [],
      { priorityTopics: ["Ecologia"] },
    );
    expect(selected.id).toBe("eco-priority");
    expect(adaptiveReasonFor(selected, [], [], { priorityTopics: ["Ecologia"] })).toContain(
      "priorizado",
    );
  });
  it("returns to introductory difficulty after repeated errors", () => {
    const questions = [
      { ...diagnosticQuestions[0], id: "guided", difficulty: 1 },
      { ...diagnosticQuestions[0], id: "advanced", difficulty: 3 },
    ];
    const attempts = [
      attempt({ id: "error-1", questionId: "old-1", correct: false }),
      attempt({ id: "error-2", questionId: "old-2", correct: false }),
    ];
    expect(selectNextQuestion(questions, [{ ...mastery, score: 90 }], attempts).id).toBe("guided");
  });
  it("summarizes areas, strengths, gaps and next steps", () => {
    const questions = diagnosticQuestions.slice(0, 2);
    const attempts = [attempt(), attempt({ questionId: "cell-02", correct: false })];
    const areas = diagnosticAreaResults(questions, attempts);
    const insights = diagnosticRecommendations([
      { ...mastery, score: 90 },
      { ...mastery, skillId: "metabolismo", label: "Metabolismo", score: 20 },
    ]);
    expect(areas).toHaveLength(2);
    expect(insights.strengths[0].label).toBe("Estrutura celular");
    expect(insights.gaps[0].label).toBe("Metabolismo");
    expect(insights.nextSteps).toHaveLength(2);
  });
});
