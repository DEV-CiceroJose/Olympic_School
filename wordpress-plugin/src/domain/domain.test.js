import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  confidenceFor,
  diagnosticPercentage,
  masteryFromDiagnostic,
  masteryLevel,
  selectNextQuestion,
  updateMastery,
} from "./learning.js";
import { generateStudyPlan } from "./study-plan.js";

const questions = [
  { id: "q1", skillId: "cells", skillLabel: "Células", difficulty: 1, correctOption: 1 },
  { id: "q2", skillId: "ecology", skillLabel: "Ecologia", difficulty: 1, correctOption: 0 },
  { id: "q3", skillId: "genetics", skillLabel: "Genética", difficulty: 2, correctOption: 2 },
];

const attempt = (overrides = {}) => ({
  id: "a1",
  questionId: "q1",
  skillId: "cells",
  selectedOption: 1,
  correct: true,
  difficulty: 1,
  responseTimeMs: 2_000,
  answeredAt: "2026-08-03T12:00:00.000Z",
  errorType: null,
  ...overrides,
});

describe("domínio de aprendizagem", () => {
  it("preserva as faixas de domínio", () => {
    assert.equal(masteryLevel(24), "Lacuna crítica");
    assert.equal(masteryLevel(25), "Domínio baixo");
    assert.equal(masteryLevel(50), "Domínio intermediário");
    assert.equal(masteryLevel(80), "Domínio alto");
  });

  it("atualiza domínio e confiança deterministicamente", () => {
    const result = updateMastery(
      { skillId: "cells", label: "Células", score: 50, attempts: 3, correctAttempts: 2, confidence: "low" },
      attempt(),
    );
    assert.equal(result.score, 56);
    assert.equal(result.confidence, "medium");
    assert.equal(confidenceFor(8), "high");
  });

  it("calcula o diagnóstico e seleciona a habilidade mais fraca", () => {
    const attempts = [attempt(), attempt({ id: "a2", questionId: "q2", skillId: "ecology", correct: false })];
    const mastery = masteryFromDiagnostic(questions, attempts);
    assert.equal(diagnosticPercentage(attempts), 50);
    assert.equal(mastery.find((item) => item.skillId === "cells").score, 100);
    assert.equal(selectNextQuestion(questions, mastery, attempts).skillId, "ecology");
  });
});

describe("gerador de plano", () => {
  it("prioriza a habilidade mais fraca e encerra com simulado", () => {
    const plan = generateStudyPlan(
      "plan-1",
      "2026-08-03T00:00:00.000Z",
      { targetOlympiad: "OBB", availableDays: ["Terça", "Sábado"], minutesPerDay: 45 },
      [
        { label: "Células", score: 80 },
        { label: "Ecologia", score: 20 },
      ],
    );
    assert.equal(plan.sessions[0].topic, "Ecologia");
    assert.equal(plan.sessions.length, 6);
    assert.equal(plan.sessions.at(-1).activity, "simulation");
  });
});
