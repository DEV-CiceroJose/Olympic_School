const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score)));

export function masteryLevel(score) {
  if (score < 25) return "Lacuna crítica";
  if (score < 50) return "Domínio baixo";
  if (score < 80) return "Domínio intermediário";
  return "Domínio alto";
}

export function confidenceFor(attempts) {
  if (attempts >= 8) return "high";
  if (attempts >= 4) return "medium";
  return "low";
}

export function evaluateAnswer(question, selectedOption, responseTimeMs) {
  const correct = selectedOption === question.correctOption;
  return {
    id: crypto.randomUUID(),
    questionId: question.id,
    skillId: question.skillId,
    selectedOption,
    correct,
    difficulty: question.difficulty,
    responseTimeMs: Math.max(0, responseTimeMs),
    answeredAt: new Date().toISOString(),
    errorType: correct ? null : "conceptual",
  };
}

export function updateMastery(current, attempt) {
  const correctFactor = attempt.difficulty === 3 ? 0.2 : attempt.difficulty === 2 ? 0.16 : 0.12;
  const errorFactor = attempt.difficulty === 3 ? 0.08 : attempt.difficulty === 2 ? 0.1 : 0.12;
  const nextScore = attempt.correct
    ? current.score + (100 - current.score) * correctFactor
    : current.score - Math.max(4, current.score * errorFactor);
  const attempts = current.attempts + 1;
  return {
    ...current,
    score: clampScore(nextScore),
    attempts,
    correctAttempts: current.correctAttempts + (attempt.correct ? 1 : 0),
    lastAttemptAt: attempt.answeredAt,
    confidence: confidenceFor(attempts),
  };
}

export function masteryFromDiagnostic(questions, attempts) {
  const bySkill = new Map();
  questions.forEach((question) => {
    const current = bySkill.get(question.skillId) ?? { label: question.skillLabel, total: 0, correct: 0 };
    const attempt = attempts.find((item) => item.questionId === question.id);
    current.total += attempt ? 1 : 0;
    current.correct += attempt?.correct ? 1 : 0;
    bySkill.set(question.skillId, current);
  });
  return [...bySkill.entries()].map(([skillId, result]) => ({
    skillId,
    label: result.label,
    score: result.total ? Math.round((result.correct / result.total) * 100) : 0,
    attempts: result.total,
    correctAttempts: result.correct,
    lastAttemptAt: attempts.filter((attempt) => attempt.skillId === skillId).at(-1)?.answeredAt,
    confidence: confidenceFor(result.total),
  }));
}

export function selectNextQuestion(questions, mastery, attempts) {
  const masteryBySkill = new Map(mastery.map((item) => [item.skillId, item]));
  const attemptedIds = new Set(attempts.map((attempt) => attempt.questionId));
  return [...questions].sort((a, b) => {
    const aMastery = masteryBySkill.get(a.skillId)?.score ?? 0;
    const bMastery = masteryBySkill.get(b.skillId)?.score ?? 0;
    const aTarget = aMastery < 40 ? 1 : aMastery <= 70 ? 2 : 3;
    const bTarget = bMastery < 40 ? 1 : bMastery <= 70 ? 2 : 3;
    const aRank = aMastery * 100 + Math.abs(a.difficulty - aTarget) * 10 + (attemptedIds.has(a.id) ? 5 : 0);
    const bRank = bMastery * 100 + Math.abs(b.difficulty - bTarget) * 10 + (attemptedIds.has(b.id) ? 5 : 0);
    return aRank - bRank || a.id.localeCompare(b.id);
  })[0];
}

export function diagnosticPercentage(attempts) {
  if (!attempts.length) return 0;
  return Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100);
}

export const learningDomain = Object.freeze({
  confidenceFor,
  diagnosticPercentage,
  evaluateAnswer,
  masteryFromDiagnostic,
  masteryLevel,
  selectNextQuestion,
  updateMastery,
});
