import { describe, expect, it } from "vitest";
import {
  confidenceFor,
  diagnosticPercentage,
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
});
