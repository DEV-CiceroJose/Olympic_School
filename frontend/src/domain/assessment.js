export const SCHOOL_CLASSES = [
  "1º DSA",
  "1º DSB",
  "1º TETA",
  "1º TETB",
  "2º DSA",
  "2º DSB",
  "2º TETA",
  "2º TETB",
  "3º DSA",
  "3º DSB",
  "3º TETA",
  "3º TETB",
];

export const ASSESSMENT_TYPES = ["diagnostico_inicial", "diagnostico_final", "simulado"];

export const ASSESSMENT_TYPE_LABELS = {
  diagnostico_inicial: "Diagnóstico inicial",
  diagnostico_final: "Diagnóstico final",
  simulado: "Simulado",
};

export const SESSION_STATUS_LABELS = {
  in_progress: "Em andamento",
  completed: "Concluído",
};

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDuration(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
}

export function assessmentTiming(session, now = new Date()) {
  const startedAt = toDate(session?.startedAt);
  const earliestSubmitAt = toDate(session?.earliestSubmitAt);
  const deadlineAt = toDate(session?.deadlineAt);
  const nowMs = now.getTime();
  return {
    startedAt,
    earliestSubmitAt,
    deadlineAt,
    canSubmit: Boolean(earliestSubmitAt && nowMs >= earliestSubmitAt.getTime()),
    expired: Boolean(deadlineAt && nowMs >= deadlineAt.getTime()),
    secondsUntilSubmit: earliestSubmitAt
      ? Math.max(0, Math.ceil((earliestSubmitAt.getTime() - nowMs) / 1000))
      : 0,
    secondsRemaining: deadlineAt
      ? Math.max(0, Math.ceil((deadlineAt.getTime() - nowMs) / 1000))
      : 0,
  };
}

export function resultLevel(percentage) {
  if (percentage < 25) return "Lacuna crítica";
  if (percentage < 50) return "Domínio baixo";
  if (percentage < 80) return "Domínio intermediário";
  return "Domínio alto";
}

export function reportInsights(areaResults = [], skillResults = []) {
  const orderedAreas = [...areaResults].sort((a, b) => a.percentage - b.percentage);
  const orderedSkills = [...skillResults].sort((a, b) => a.percentage - b.percentage);
  return {
    strengths: orderedSkills
      .filter((item) => item.percentage >= 80)
      .slice(-3)
      .reverse(),
    gaps: orderedSkills.filter((item) => item.percentage < 50).slice(0, 3),
    priorityAreas: orderedAreas.slice(0, 3),
  };
}
