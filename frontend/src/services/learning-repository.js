import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { learningCacheKeys } from "@/services/learning-cache";
function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Faça login para acessar seu progresso.");
  return uid;
}
function readLocal(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "");
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}
function localSnapshot(uid) {
  const keys = learningCacheKeys(uid);
  return {
    attempts: readLocal(keys.attempts, []),
    mastery: readLocal(keys.mastery, []),
    events: readLocal(keys.events, []),
  };
}
function asIso(value) {
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
function attemptFromDoc(snapshot) {
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
function masteryFromDoc(snapshot) {
  const data = snapshot.data();
  return {
    skillId: snapshot.id,
    label: data.label,
    score: data.score,
    attempts: data.attempts,
    correctAttempts: data.correctAttempts,
    lastAttemptAt: data.lastAttemptAt ? asIso(data.lastAttemptAt) : undefined,
    confidence: data.confidence,
  };
}
function eventFromDoc(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    type: data.type,
    skillId: data.skillId,
    score: data.score,
    occurredAt: asIso(data.occurredAt),
  };
}
async function saveAttemptRemote(uid, attempt) {
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
async function saveMasteryRemote(uid, mastery) {
  if (!mastery.length) return;
  const batch = writeBatch(db);
  for (const item of mastery) {
    const data = {
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
async function saveEventRemote(uid, event) {
  const data = {
    type: event.type,
    occurredAt: Timestamp.fromDate(new Date(event.occurredAt)),
    createdAt: serverTimestamp(),
  };
  if (event.skillId) data.skillId = event.skillId;
  if (event.score !== undefined) data.score = event.score;
  await setDoc(doc(db, "users", uid, "progressEvents", event.id), data);
}
async function readRemote(uid) {
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
async function migrateLocalIfNeeded(uid, remote) {
  const local = localSnapshot(uid);
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
  async getSnapshot() {
    const uid = currentUid();
    const keys = learningCacheKeys(uid);
    try {
      const snapshot = await migrateLocalIfNeeded(uid, await readRemote(uid));
      writeLocal(keys.attempts, snapshot.attempts);
      writeLocal(keys.mastery, snapshot.mastery);
      writeLocal(keys.events, snapshot.events);
      return snapshot;
    } catch {
      return localSnapshot(uid);
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
  async saveAttempt(attempt) {
    const uid = currentUid();
    const key = learningCacheKeys(uid).attempts;
    const local = readLocal(key, []);
    writeLocal(key, [...local.filter((item) => item.id !== attempt.id), attempt]);
    await saveAttemptRemote(uid, attempt);
  },
  async saveMastery(mastery) {
    const uid = currentUid();
    writeLocal(learningCacheKeys(uid).mastery, mastery);
    await saveMasteryRemote(uid, mastery);
  },
  async saveEvent(event) {
    const uid = currentUid();
    const key = learningCacheKeys(uid).events;
    const local = readLocal(key, []);
    writeLocal(key, [...local.filter((item) => item.id !== event.id), event]);
    await saveEventRemote(uid, event);
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
    const keys = learningCacheKeys(uid);
    writeLocal(keys.attempts, []);
    writeLocal(keys.mastery, []);
    writeLocal(keys.events, []);
  },
};
