import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { GoogleIcon } from "@/components/auth/google-icon";
import { ProfileDialog } from "@/components/auth/profile-dialog";
import { useAuth } from "@/components/auth/auth-provider";
const title = "Entrar na Olympic School — Acesso com Google";
const description =
  "Entre na Olympic School com sua conta Google. No primeiro acesso, conclua o cadastro com nome e turma.";
export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});
function friendlyAuthError(error) {
  const code =
    typeof error === "object" && error && "code" in error ? String(error.code) : String(error);
  if (code.includes("popup-closed-by-user")) return "A janela de acesso foi fechada.";
  if (code.includes("popup-blocked")) return "Permita pop-ups para entrar com o Google.";
  if (code.includes("unauthorized-domain")) return "Este domínio ainda não foi autorizado.";
  if (code.includes("FIREBASE_NOT_CONFIGURED")) {
    return "O Firebase ainda não foi configurado neste ambiente.";
  }
  return "Não foi possível concluir o acesso. Tente novamente.";
}
function AuthPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, login, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    if (!authLoading && user && profile?.profileCompleted) {
      void navigate({ to: "/app", replace: true });
    } else if (!authLoading && user && profile && !profile.profileCompleted) {
      setProfileOpen(true);
    }
  }, [authLoading, navigate, profile, user]);
  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const nextProfile = await login();
      if (nextProfile.profileCompleted) {
        await navigate({ to: "/app" });
        return;
      }
      setProfileOpen(true);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="auth-entry">
      <header className="auth-entry-header">
        <Link to="/" className="rounded-md">
          <Logo />
        </Link>
        <Link to="/" className="auth-entry-home">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao início
        </Link>
      </header>

      <main className="auth-entry-main">
        <div className="auth-entry-content">
          <h1 className="auth-entry-title">
            Entrar na <span>Olympic School</span>
          </h1>
          <p className="auth-entry-description">
            Use sua conta Google. No primeiro acesso, informe seu nome e sua turma.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || authLoading}
            className="auth-entry-button"
          >
            <span className="auth-entry-google" aria-hidden="true">
              {loading || authLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <GoogleIcon className="size-5" />
              )}
            </span>
            {loading || authLoading ? "Conectando…" : "Continuar com Google"}
          </button>

          {error ? (
            <p role="alert" className="auth-entry-error">
              {error}
            </p>
          ) : null}
        </div>
      </main>

      <ProfileDialog
        open={profileOpen}
        defaultName={profile?.name ?? user?.displayName ?? ""}
        onSubmit={async (input) => {
          await completeProfile(input);
        }}
        onCompleted={() => {
          setProfileOpen(false);
          void navigate({ to: "/app" });
        }}
      />
    </div>
  );
}
