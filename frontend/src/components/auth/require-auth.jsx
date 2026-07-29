import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "./auth-provider";
export function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && (!user || !profile?.profileCompleted)) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [loading, navigate, profile?.profileCompleted, user]);
  if (loading || !user || !profile?.profileCompleted) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          Verificando seu acesso...
        </div>
      </main>
    );
  }
  return children;
}
