import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

const KEYS = {
  attempts: "biodoraia.learning.attempts",
  mastery: "biodoraia.learning.mastery",
  events: "biodoraia.learning.events",
};

function context() {
  const { auth, db } = getFirebaseRuntime();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return { db, uid };
}

function readLocal(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "");
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function localSnapshot() {
  return {
    attempts: readLocal(KEYS.attempts, []),
    mastery: readLocal(KEYS.mastery, []),
    events: readLocal(KEYS.events, []),
  };
}

function asIso(value) {
  return value?.toDate?.().toISOString() ?? new Date().toISOString();
}

async function saveAttemptRemote(db, uid, attempt) {
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

async function saveMasteryRemote(db, uid, mastery) {
  if (!mastery.length) return;
  const batch = writeBatch(db);
  mastery.forEach((item) => {
    const data = {
      skillId: item.skillId,
      label: item.label,
      score: item.score,
      attempts: item.attempts,
      correctAttempts: item.correctAttempts,
      confidence: item.confidence,
      updatedAt: serverTimestamp(),
    };
    if (item.lastAttemptAt) data.lastAttemptAt = Timestamp.fromDate(new Date(item.lastAttemptAt));
    batch.set(doc(db, "users", uid, "skillMastery", item.skillId), data);
  });
  await batch.commit();
}

async function saveEventRemote(db, uid, event) {
  const data = {
    type: event.type,
    occurredAt: Timestamp.fromDate(new Date(event.occurredAt)),
    createdAt: serverTimestamp(),
  };
  if (event.skillId) data.skillId = event.skillId;
  if (event.score !== undefined) data.score = event.score;
  await setDoc(doc(db, "users", uid, "progressEvents", event.id), data);
}

async function readRemote(db, uid) {
  const [attempts, mastery, events] = await Promise.all([
    getDocs(collection(db, "users", uid, "attempts")),
    getDocs(collection(db, "users", uid, "skillMastery")),
    getDocs(collection(db, "users", uid, "progressEvents")),
  ]);
  return {
    attempts: attempts.docs.map((item) => ({ id: item.id, ...item.data(), answeredAt: asIso(item.data().answeredAt) })),
    mastery: mastery.docs.map((item) => ({ skillId: item.id, ...item.data(), lastAttemptAt: item.data().lastAttemptAt ? asIso(item.data().lastAttemptAt) : undefined })),
    events: events.docs.map((item) => ({ id: item.id, ...item.data(), occurredAt: asIso(item.data().occurredAt) })),
  };
}

async function migrateLocalIfNeeded(db, uid, remote) {
  const local = localSnapshot();
  if (!remote.attempts.length) await Promise.all(local.attempts.map((item) => saveAttemptRemote(db, uid, item)));
  if (!remote.mastery.length) await saveMasteryRemote(db, uid, local.mastery);
  if (!remote.events.length) await Promise.all(local.events.map((item) => saveEventRemote(db, uid, item)));
  return {
    attempts: remote.attempts.length ? remote.attempts : local.attempts,
    mastery: remote.mastery.length ? remote.mastery : local.mastery,
    events: remote.events.length ? remote.events : local.events,
  };
}

export const learningRepository = Object.freeze({
  async getSnapshot() {
    const { db, uid } = context();
    try {
      const snapshot = await migrateLocalIfNeeded(db, uid, await readRemote(db, uid));
      writeLocal(KEYS.attempts, snapshot.attempts);
      writeLocal(KEYS.mastery, snapshot.mastery);
      writeLocal(KEYS.events, snapshot.events);
      return snapshot;
    } catch {
      return localSnapshot();
    }
  },

  async saveAttempt(attempt) {
    const { db, uid } = context();
    const local = readLocal(KEYS.attempts, []);
    writeLocal(KEYS.attempts, [...local.filter((item) => item.id !== attempt.id), attempt]);
    await saveAttemptRemote(db, uid, attempt);
  },

  async saveMastery(mastery) {
    const { db, uid } = context();
    writeLocal(KEYS.mastery, mastery);
    await saveMasteryRemote(db, uid, mastery);
  },

  async saveEvent(event) {
    const { db, uid } = context();
    const local = readLocal(KEYS.events, []);
    writeLocal(KEYS.events, [...local.filter((item) => item.id !== event.id), event]);
    await saveEventRemote(db, uid, event);
  },

  async resetDiagnostic() {
    const { db, uid } = context();
    const snapshots = await Promise.all([
      getDocs(collection(db, "users", uid, "attempts")),
      getDocs(collection(db, "users", uid, "skillMastery")),
      getDocs(collection(db, "users", uid, "progressEvents")),
    ]);
    const references = snapshots.flatMap((snapshot) => snapshot.docs.map((item) => item.ref));
    for (let index = 0; index < references.length; index += 400) {
      const batch = writeBatch(db);
      references.slice(index, index + 400).forEach((reference) => batch.delete(reference));
      await batch.commit();
    }
    Object.values(KEYS).forEach((key) => writeLocal(key, []));
  },
});
