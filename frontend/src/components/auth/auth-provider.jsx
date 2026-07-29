import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  completeStudentProfile,
  getStudentProfile,
  signInWithGoogle,
  signOut,
} from "@/services/auth-service";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        setProfile(await getStudentProfile(nextUser.uid));
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
      loading,
      login: async () => {
        const nextProfile = await signInWithGoogle();
        setUser(auth.currentUser);
        setProfile(nextProfile);
        return nextProfile;
      },
      logout: async () => {
        await signOut();
        setUser(null);
        setProfile(null);
      },
      completeProfile: async (input) => {
        const nextProfile = await completeStudentProfile(input);
        setProfile(nextProfile);
        return nextProfile;
      },
    }),
    [loading, profile, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
