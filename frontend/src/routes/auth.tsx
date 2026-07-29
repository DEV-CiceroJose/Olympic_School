import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Sparkles, GraduationCap } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { GoogleIcon } from "@/components/auth/google-icon";
import { ProfileDialog } from "@/components/auth/profile-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

const title = "Entrar na BiodoraIA — Acesso com Google";
const description =
  "Entre na BiodoraIA com sua conta Google. No primeiro acesso, conclua o cadastro com nome e turma.";

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

function friendlyAuthError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error ? String(error.code) : String(error);
  if (code.includes("popup-closed-by-user")) return "A janela de acesso foi fechada.";
  if (code.includes("popup-blocked")) return "Permita pop-ups para entrar com o Google.";
  if (code.includes("unauthorized-domain")) return "Este domínio ainda não foi autorizado.";
  return "Não foi possível concluir o acesso. Tente novamente.";
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, login, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2">
            <Logo />
          </Link>
        </div>

        <section className="rounded-3xl border border-border bg-card/70 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Acesso único
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Entrar na BiodoraIA
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Login e cadastro no mesmo lugar. Use sua conta Google — no primeiro acesso, pedimos
            apenas <strong className="font-semibold text-foreground">nome</strong> e{" "}
            <strong className="font-semibold text-foreground">turma</strong>.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || authLoading}
            className={cn(
              "group mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-secondary px-6 py-3.5",
              "text-sm font-semibold text-foreground transition-all hover:border-primary/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-70",
            )}
          >
            {loading || authLoading ? (
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            {loading || authLoading ? "Conectando..." : "Continuar com Google"}
          </button>

          {error ? (
            <p role="alert" className="mt-3 text-center text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <ul className="mt-7 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Autenticação segura pelo Google, sem senha armazenada pela BiodoraIA.</span>
            </li>
            <li className="flex gap-3">
              <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Perfil individual e dados de estudo isolados por estudante.</span>
            </li>
          </ul>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Voltar para a página inicial
          </Link>
        </p>
      </div>

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
    </main>
  );
}
