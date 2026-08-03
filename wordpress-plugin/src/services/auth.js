import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function profileRef(uid) {
  return doc(getFirebaseRuntime().db, "users", uid);
}

export async function getStudentProfile(uid) {
  const snapshot = await getDoc(profileRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function ensureStudentProfile(user) {
  const existing = await getStudentProfile(user.uid);
  if (existing) return existing;

  const profile = {
    uid: user.uid,
    email: user.email ?? "",
    name: user.displayName?.trim() || "Estudante",
    avatarUrl: user.photoURL ?? "",
    profileCompleted: false,
  };
  await setDoc(profileRef(user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return profile;
}

export async function signInWithGoogle() {
  const { auth } = getFirebaseRuntime();
  const credential = await signInWithPopup(auth, provider);
  const profile = await ensureStudentProfile(credential.user);
  return { user: credential.user, profile };
}

export async function completeStudentProfile(input) {
  const { auth } = getFirebaseRuntime();
  const user = auth.currentUser;
  if (!user) throw new Error("AUTH_REQUIRED");
  const existing = await getStudentProfile(user.uid);
  if (!existing) throw new Error("PROFILE_NOT_FOUND");

  const profile = {
    ...existing,
    name: String(input.name ?? "").trim(),
    turma: String(input.turma ?? "").trim(),
    profileCompleted: true,
  };
  if (!profile.name || !profile.turma) throw new Error("PROFILE_INVALID");

  await setDoc(
    profileRef(user.uid),
    {
      name: profile.name,
      turma: profile.turma,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return profile;
}

export function observeAuth(callback) {
  return onAuthStateChanged(getFirebaseRuntime().auth, callback);
}

export function getCurrentUser() {
  return getFirebaseRuntime().auth.currentUser;
}

export function signOut() {
  return firebaseSignOut(getFirebaseRuntime().auth);
}

export const authService = Object.freeze({
  completeStudentProfile,
  ensureStudentProfile,
  getCurrentUser,
  getStudentProfile,
  observe: observeAuth,
  signInWithGoogle,
  signOut,
});
