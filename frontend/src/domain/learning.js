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
  for (const question of questions) {
    const current = bySkill.get(question.skillId) ?? {
      label: question.skillLabel,
      total: 0,
      correct: 0,
    };
    const attempt = attempts.find((item) => item.questionId === question.id);
    current.total += attempt ? 1 : 0;
    current.correct += attempt?.correct ? 1 : 0;
    bySkill.set(question.skillId, current);
  }
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
function normalizedText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesPriority(question, priorityTopics = []) {
  const searchable = normalizedText(
    `${question.area} ${question.skillId} ${question.skillLabel} ${question.prompt}`,
  );
  return priorityTopics.some((topic) => searchable.includes(normalizedText(topic)));
}

function evidenceForSkill(attempts, skillId) {
  const skillAttempts = attempts.filter((attempt) => attempt.skillId === skillId);
  const recent = skillAttempts.slice(-4);
  const consecutiveErrors = [...skillAttempts].reverse().findIndex((attempt) => attempt.correct);
  return {
    attempts: skillAttempts.length,
    recentError: recent.some((attempt) => !attempt.correct),
    repeatedErrors:
      skillAttempts.length > 0 && consecutiveErrors === -1
        ? skillAttempts.length
        : Math.max(0, consecutiveErrors),
    averageResponseTimeMs: recent.length
      ? recent.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0) / recent.length
      : 0,
  };
}

function questionRank(question, masteryBySkill, attempts, context) {
  const currentMastery = masteryBySkill.get(question.skillId)?.score ?? 0;
  const evidence = evidenceForSkill(attempts, question.skillId);
  const targetDifficulty =
    evidence.repeatedErrors >= 2 ? 1 : currentMastery < 40 ? 1 : currentMastery <= 70 ? 2 : 3;
  const questionAttempts = attempts.filter((attempt) => attempt.questionId === question.id).length;
  return (
    currentMastery * 10 +
    Math.abs(question.difficulty - targetDifficulty) * 80 +
    questionAttempts * 35 +
    evidence.attempts * 3 -
    (evidence.recentError ? 60 : 0) -
    Math.min(evidence.repeatedErrors, 3) * 90 -
    (evidence.averageResponseTimeMs >= 45_000 ? 40 : 0) -
    (matchesPriority(question, context.priorityTopics) ? 100 : 0)
  );
}

export function selectNextQuestion(questions, mastery, attempts, context = {}) {
  const masteryBySkill = new Map(mastery.map((item) => [item.skillId, item]));
  const ranked = [...questions].sort((a, b) => {
    const aRank = questionRank(a, masteryBySkill, attempts, context);
    const bRank = questionRank(b, masteryBySkill, attempts, context);
    return aRank - bRank || a.id.localeCompare(b.id);
  });
  return ranked[0];
}

export function adaptiveReasonFor(question, mastery, attempts, context = {}) {
  const evidence = evidenceForSkill(attempts, question.skillId);
  if (evidence.repeatedErrors >= 2) {
    return "Você repetiu erros nesta habilidade; voltamos a uma questão guiada para reconstruir o conceito.";
  }
  if (matchesPriority(question, context.priorityTopics)) {
    return `Este tema está priorizado no seu plano${context.targetOlympiad ? ` para ${context.targetOlympiad}` : ""}.`;
  }
  if (evidence.averageResponseTimeMs >= 45_000) {
    return "O tempo recente de resposta indica que vale consolidar esta habilidade.";
  }
  const score = mastery.find((item) => item.skillId === question.skillId)?.score ?? 0;
  return score < 40
    ? "Selecionada por ser uma das habilidades com maior lacuna registrada."
    : "Selecionada para manter dificuldade progressiva e ampliar as evidências de domínio.";
}
export function diagnosticPercentage(attempts) {
  if (!attempts.length) return 0;
  return Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100);
}

export function diagnosticAreaResults(questions, attempts) {
  const results = new Map();
  for (const question of questions) {
    const current = results.get(question.area) ?? { area: question.area, attempts: 0, correct: 0 };
    const attempt = attempts.find((item) => item.questionId === question.id);
    if (attempt) {
      current.attempts += 1;
      current.correct += attempt.correct ? 1 : 0;
    }
    results.set(question.area, current);
  }
  return [...results.values()]
    .map((result) => ({
      ...result,
      score: result.attempts ? Math.round((result.correct / result.attempts) * 100) : 0,
    }))
    .sort((a, b) => a.score - b.score || a.area.localeCompare(b.area));
}

export function diagnosticRecommendations(mastery) {
  const ordered = [...mastery].sort((a, b) => a.score - b.score);
  return {
    gaps: ordered.filter((item) => item.score < 50),
    strengths: ordered.filter((item) => item.score >= 80).reverse(),
    nextSteps: ordered.slice(0, 3).map((item) => ({
      skillId: item.skillId,
      text:
        item.score < 25
          ? `Recomece ${item.label} por conceitos fundamentais e questões introdutórias.`
          : `Pratique ${item.label} com questões comentadas antes de aumentar a dificuldade.`,
    })),
  };
}
