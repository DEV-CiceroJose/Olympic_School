export type Difficulty = 1 | 2 | 3;

export type SkillId =
  | "estrutura_celular"
  | "metabolismo"
  | "probabilidade_genetica"
  | "interpretacao_de_heredogramas"
  | "selecao_natural"
  | "relacoes_ecologicas"
  | "fisiologia_humana"
  | "classificacao_biologica"
  | "interpretacao_de_graficos"
  | "analise_experimental";

export type ErrorType = "conceptual" | "interpretation" | "incomplete_reasoning" | null;

export type BiologyQuestion = {
  id: string;
  area: string;
  skillId: SkillId;
  skillLabel: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: Difficulty;
};

export type LearningAttempt = {
  id: string;
  questionId: string;
  skillId: SkillId;
  selectedOption: number;
  correct: boolean;
  difficulty: Difficulty;
  responseTimeMs: number;
  answeredAt: string;
  errorType: ErrorType;
};

export type SkillMastery = {
  skillId: SkillId;
  label: string;
  score: number;
  attempts: number;
  correctAttempts: number;
  lastAttemptAt?: string;
  confidence: "low" | "medium" | "high";
};

export type ProgressEvent = {
  id: string;
  type: "diagnostic_completed" | "training_attempt";
  skillId?: SkillId;
  score?: number;
  occurredAt: string;
};

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

export function masteryLevel(score: number) {
  if (score < 25) return "Lacuna crítica";
  if (score < 50) return "Domínio baixo";
  if (score < 80) return "Domínio intermediário";
  return "Domínio alto";
}

export function confidenceFor(attempts: number): SkillMastery["confidence"] {
  if (attempts >= 8) return "high";
  if (attempts >= 4) return "medium";
  return "low";
}

export function evaluateAnswer(
  question: BiologyQuestion,
  selectedOption: number,
  responseTimeMs: number,
): LearningAttempt {
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

export function updateMastery(current: SkillMastery, attempt: LearningAttempt): SkillMastery {
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

export function masteryFromDiagnostic(
  questions: BiologyQuestion[],
  attempts: LearningAttempt[],
): SkillMastery[] {
  const bySkill = new Map<SkillId, { label: string; total: number; correct: number }>();

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

export function selectNextQuestion(
  questions: BiologyQuestion[],
  mastery: SkillMastery[],
  attempts: LearningAttempt[],
): BiologyQuestion {
  const masteryBySkill = new Map(mastery.map((item) => [item.skillId, item]));
  const attemptedIds = new Set(attempts.map((attempt) => attempt.questionId));
  const ranked = [...questions].sort((a, b) => {
    const aMastery = masteryBySkill.get(a.skillId)?.score ?? 0;
    const bMastery = masteryBySkill.get(b.skillId)?.score ?? 0;
    const aTarget: Difficulty = aMastery < 40 ? 1 : aMastery <= 70 ? 2 : 3;
    const bTarget: Difficulty = bMastery < 40 ? 1 : bMastery <= 70 ? 2 : 3;
    const aRank =
      aMastery * 100 + Math.abs(a.difficulty - aTarget) * 10 + (attemptedIds.has(a.id) ? 5 : 0);
    const bRank =
      bMastery * 100 + Math.abs(b.difficulty - bTarget) * 10 + (attemptedIds.has(b.id) ? 5 : 0);
    return aRank - bRank || a.id.localeCompare(b.id);
  });

  return ranked[0];
}

export function diagnosticPercentage(attempts: LearningAttempt[]) {
  if (!attempts.length) return 0;
  return Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100);
}
