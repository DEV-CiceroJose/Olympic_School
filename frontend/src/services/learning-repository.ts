import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { LearningAttempt, ProgressEvent, SkillId, SkillMastery } from "@/domain/learning";
import { auth, db } from "@/lib/firebase";

type LearningSnapshot = {
  attempts: LearningAttempt[];
  mastery: SkillMastery[];
  events: ProgressEvent[];
};

const KEYS = {
  attempts: "biodoraia.learning.attempts",
  mastery: "biodoraia.learning.mastery",
  events: "biodoraia.learning.events",
};

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Faça login para acessar seu progresso.");
  return uid;
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function localSnapshot(): LearningSnapshot {
  return {
    attempts: readLocal<LearningAttempt[]>(KEYS.attempts, []),
    mastery: readLocal<SkillMastery[]>(KEYS.mastery, []),
    events: readLocal<ProgressEvent[]>(KEYS.events, []),
  };
}

function asIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function attemptFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): LearningAttempt {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    questionId: data.questionId,
    skillId: data.skillId,
    selectedOption: data.selectedOption,
    correct: data.correct,
    difficulty: data.difficulty,
    responseTimeMs: data.responseTimeMs,
    answeredAt: asIso(data.answeredAt),
    errorType: data.errorType ?? null,
  };
}

function masteryFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): SkillMastery {
  const data = snapshot.data();
  return {
    skillId: snapshot.id as SkillId,
    label: data.label,
    score: data.score,
    attempts: data.attempts,
    correctAttempts: data.correctAttempts,
    lastAttemptAt: data.lastAttemptAt ? asIso(data.lastAttemptAt) : undefined,
    confidence: data.confidence,
  };
}

function eventFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): ProgressEvent {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    type: data.type,
    skillId: data.skillId,
    score: data.score,
    occurredAt: asIso(data.occurredAt),
  };
}

async function saveAttemptRemote(uid: string, attempt: LearningAttempt) {
  await setDoc(doc(db, "users", uid, "attempts", attempt.id), {
    questionId: attempt.questionId,
    skillId: attempt.skillId,
    selectedOption: attempt.selectedOption,
    correct: attempt.correct,
    difficulty: attempt.difficulty,
    responseTimeMs: Math.min(attempt.responseTimeMs, 86_400_000),
    answeredAt: Timestamp.fromDate(new Date(attempt.answeredAt)),
    errorType: attempt.errorType,
    createdAt: serverTimestamp(),
  });
}

async function saveMasteryRemote(uid: string, mastery: SkillMastery[]) {
  if (!mastery.length) return;
  const batch = writeBatch(db);
  for (const item of mastery) {
    const data: Record<string, unknown> = {
      skillId: item.skillId,
      label: item.label,
      score: item.score,
      attempts: item.attempts,
      correctAttempts: item.correctAttempts,
      confidence: item.confidence,
      updatedAt: serverTimestamp(),
    };
    if (item.lastAttemptAt) {
      data.lastAttemptAt = Timestamp.fromDate(new Date(item.lastAttemptAt));
    }
    batch.set(doc(db, "users", uid, "skillMastery", item.skillId), data);
  }
  await batch.commit();
}

async function saveEventRemote(uid: string, event: ProgressEvent) {
  const data: Record<string, unknown> = {
    type: event.type,
    occurredAt: Timestamp.fromDate(new Date(event.occurredAt)),
    createdAt: serverTimestamp(),
  };
  if (event.skillId) data.skillId = event.skillId;
  if (event.score !== undefined) data.score = event.score;
  await setDoc(doc(db, "users", uid, "progressEvents", event.id), data);
}

async function readRemote(uid: string): Promise<LearningSnapshot> {
  const [attemptsSnapshot, masterySnapshot, eventsSnapshot] = await Promise.all([
    getDocs(collection(db, "users", uid, "attempts")),
    getDocs(collection(db, "users", uid, "skillMastery")),
    getDocs(collection(db, "users", uid, "progressEvents")),
  ]);
  return {
    attempts: attemptsSnapshot.docs
      .map(attemptFromDoc)
      .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt)),
    mastery: masterySnapshot.docs.map(masteryFromDoc),
    events: eventsSnapshot.docs
      .map(eventFromDoc)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
  };
}

async function migrateLocalIfNeeded(
  uid: string,
  remote: LearningSnapshot,
): Promise<LearningSnapshot> {
  const local = localSnapshot();
  const attempts = remote.attempts.length ? remote.attempts : local.attempts;
  const mastery = remote.mastery.length ? remote.mastery : local.mastery;
  const events = remote.events.length ? remote.events : local.events;

  await Promise.all([
    remote.attempts.length === 0
      ? Promise.all(local.attempts.map((attempt) => saveAttemptRemote(uid, attempt)))
      : Promise.resolve(),
    remote.mastery.length === 0 ? saveMasteryRemote(uid, local.mastery) : Promise.resolve(),
    remote.events.length === 0
      ? Promise.all(local.events.map((event) => saveEventRemote(uid, event)))
      : Promise.resolve(),
  ]);

  return { attempts, mastery, events };
}

export const learningRepository = {
  async getSnapshot(): Promise<LearningSnapshot> {
    const uid = currentUid();
    try {
      const snapshot = await migrateLocalIfNeeded(uid, await readRemote(uid));
      writeLocal(KEYS.attempts, snapshot.attempts);
      writeLocal(KEYS.mastery, snapshot.mastery);
      writeLocal(KEYS.events, snapshot.events);
      return snapshot;
    } catch {
      return localSnapshot();
    }
  },

  async getAttempts() {
    return (await this.getSnapshot()).attempts;
  },

  async getMastery() {
    return (await this.getSnapshot()).mastery;
  },

  async getEvents() {
    return (await this.getSnapshot()).events;
  },

  async saveAttempt(attempt: LearningAttempt) {
    const local = readLocal<LearningAttempt[]>(KEYS.attempts, []);
    writeLocal(KEYS.attempts, [...local.filter((item) => item.id !== attempt.id), attempt]);
    await saveAttemptRemote(currentUid(), attempt);
  },

  async saveMastery(mastery: SkillMastery[]) {
    writeLocal(KEYS.mastery, mastery);
    await saveMasteryRemote(currentUid(), mastery);
  },

  async saveEvent(event: ProgressEvent) {
    const local = readLocal<ProgressEvent[]>(KEYS.events, []);
    writeLocal(KEYS.events, [...local.filter((item) => item.id !== event.id), event]);
    await saveEventRemote(currentUid(), event);
  },

  async resetDiagnostic() {
    const uid = currentUid();
    const snapshots = await Promise.all([
      getDocs(collection(db, "users", uid, "attempts")),
      getDocs(collection(db, "users", uid, "skillMastery")),
      getDocs(collection(db, "users", uid, "progressEvents")),
    ]);
    const references = snapshots.flatMap((snapshot) => snapshot.docs.map((item) => item.ref));

    for (let index = 0; index < references.length; index += 400) {
      const batch = writeBatch(db);
      for (const reference of references.slice(index, index + 400)) {
        batch.delete(reference);
      }
      await batch.commit();
    }

    writeLocal(KEYS.attempts, []);
    writeLocal(KEYS.mastery, []);
    writeLocal(KEYS.events, []);
  },
};
