import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type StudentProfile = {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
  turma?: string;
  profileCompleted: boolean;
};

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function profileRef(uid: string) {
  return doc(db, "users", uid);
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snapshot = await getDoc(profileRef(uid));
  return snapshot.exists() ? (snapshot.data() as StudentProfile) : null;
}

async function ensureStudentProfile(user: User): Promise<StudentProfile> {
  const existing = await getStudentProfile(user.uid);
  if (existing) return existing;

  const profile: StudentProfile = {
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

export async function signInWithGoogle(): Promise<StudentProfile> {
  const credential = await signInWithPopup(auth, provider);
  return ensureStudentProfile(credential.user);
}

export async function completeStudentProfile(input: {
  name: string;
  turma: string;
}): Promise<StudentProfile> {
  const user = auth.currentUser;
  if (!user) throw new Error("AUTH_REQUIRED");
  const existing = await getStudentProfile(user.uid);
  if (!existing) throw new Error("PROFILE_NOT_FOUND");

  const profile: StudentProfile = {
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

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
