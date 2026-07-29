import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  completeStudentProfile,
  getStudentProfile,
  signInWithGoogle,
  signOut,
  type StudentProfile,
} from "@/services/auth-service";

type AuthContextValue = {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  login: () => Promise<StudentProfile>;
  logout: () => Promise<void>;
  completeProfile: (input: { name: string; turma: string }) => Promise<StudentProfile>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
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

  const value = useMemo<AuthContextValue>(
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
