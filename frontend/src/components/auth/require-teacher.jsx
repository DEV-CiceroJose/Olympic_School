import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";

export function RequireTeacher({ children }) {
  const { user, profile, isTeacher, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile?.profileCompleted) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (!isTeacher) void navigate({ to: "/app", replace: true });
  }, [isTeacher, loading, navigate, profile?.profileCompleted, user]);

  if (loading || !user || !profile?.profileCompleted || !isTeacher) {
    return (
      <main className="grid min-h-[60vh] place-items-center text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          Verificando acesso de professor...
        </div>
      </main>
    );
  }
  return children;
}
