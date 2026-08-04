import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
function profileRef(uid) {
  return doc(db, "users", uid);
}
export async function getStudentProfile(uid) {
  const snapshot = await getDoc(profileRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}
async function ensureStudentProfile(user) {
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
  if (!isFirebaseConfigured) throw new Error("FIREBASE_NOT_CONFIGURED");
  const credential = await signInWithPopup(auth, provider);
  return ensureStudentProfile(credential.user);
}
export async function completeStudentProfile(input) {
  const user = auth.currentUser;
  if (!user) throw new Error("AUTH_REQUIRED");
  const existing = await getStudentProfile(user.uid);
  if (!existing) throw new Error("PROFILE_NOT_FOUND");
  const profile = {
    ...existing,
    name: input.name.trim(),
    turma: input.turma.trim(),
    profileCompleted: true,
  };
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
export async function signOut() {
  await firebaseSignOut(auth);
}
