import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  completeStudentProfile,
  getStudentProfile,
  signInWithGoogle,
  signOut,
} from "@/services/auth-service";
import { hasTeacherAccess } from "@/domain/auth-claims";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setIsTeacher(false);
        setLoading(false);
        return;
      }
      try {
        const [nextProfile, token] = await Promise.all([
          getStudentProfile(nextUser.uid),
          nextUser.getIdTokenResult(),
        ]);
        setProfile(nextProfile);
        setIsTeacher(hasTeacherAccess(token.claims));
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);
  const value = useMemo(
    () => ({
      user,
      profile,
      isTeacher,
      loading,
      login: async () => {
        const nextProfile = await signInWithGoogle();
        setUser(auth.currentUser);
        setProfile(nextProfile);
        const token = await auth.currentUser?.getIdTokenResult();
        setIsTeacher(hasTeacherAccess(token?.claims));
        return nextProfile;
      },
      logout: async () => {
        await signOut();
        setUser(null);
        setProfile(null);
        setIsTeacher(false);
      },
      refreshAccess: async () => {
        const token = await auth.currentUser?.getIdTokenResult(true);
        const nextIsTeacher = hasTeacherAccess(token?.claims);
        setIsTeacher(nextIsTeacher);
        return nextIsTeacher;
      },
      completeProfile: async (input) => {
        const nextProfile = await completeStudentProfile(input);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [isTeacher, loading, profile, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
