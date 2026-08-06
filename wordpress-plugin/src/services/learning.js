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

function keysFor(uid) {
  return {
    attempts: `biodoraia.learning.${uid}.attempts`,
    mastery: `biodoraia.learning.${uid}.mastery`,
    events: `biodoraia.learning.${uid}.events`,
  };
}

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

function localSnapshot(uid) {
  const keys = keysFor(uid);
  return {
    attempts: readLocal(keys.attempts, []),
    mastery: readLocal(keys.mastery, []),
    events: readLocal(keys.events, []),
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
  const local = localSnapshot(uid);
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
    const keys = keysFor(uid);
    try {
      const snapshot = await migrateLocalIfNeeded(db, uid, await readRemote(db, uid));
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
    const { db, uid } = context();
    const key = keysFor(uid).attempts;
    const local = readLocal(key, []);
    writeLocal(key, [...local.filter((item) => item.id !== attempt.id), attempt]);
    await saveAttemptRemote(db, uid, attempt);
  },

  async saveMastery(mastery) {
    const { db, uid } = context();
    writeLocal(keysFor(uid).mastery, mastery);
    await saveMasteryRemote(db, uid, mastery);
  },

  async saveEvent(event) {
    const { db, uid } = context();
    const key = keysFor(uid).events;
    const local = readLocal(key, []);
    writeLocal(key, [...local.filter((item) => item.id !== event.id), event]);
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
    Object.values(keysFor(uid)).forEach((key) => writeLocal(key, []));
  },
});
