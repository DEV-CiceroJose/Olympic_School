import type { LearningAttempt, ProgressEvent, SkillMastery } from "@/domain/learning";

const KEYS = {
  attempts: "biodoraia.learning.attempts",
  mastery: "biodoraia.learning.mastery",
  events: "biodoraia.learning.events",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export const learningRepository = {
  getAttempts: () => read<LearningAttempt[]>(KEYS.attempts, []),
  getMastery: () => read<SkillMastery[]>(KEYS.mastery, []),
  getEvents: () => read<ProgressEvent[]>(KEYS.events, []),
  saveAttempt(attempt: LearningAttempt) {
    write(KEYS.attempts, [...this.getAttempts(), attempt]);
  },
  saveMastery(mastery: SkillMastery[]) {
    write(KEYS.mastery, mastery);
  },
  saveEvent(event: ProgressEvent) {
    write(KEYS.events, [...this.getEvents(), event]);
  },
  resetDiagnostic() {
    write(KEYS.attempts, []);
    write(KEYS.mastery, []);
    write(KEYS.events, []);
  },
};
