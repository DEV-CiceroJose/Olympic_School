import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Sparkles, GraduationCap } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { GoogleIcon } from "@/components/auth/google-icon";
import { ProfileDialog } from "@/components/auth/profile-dialog";
import { signInWithGoogleMock, type MockUser } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

const title = "Entrar na BiodoraIA — Acesso com Google";
const description =
  "Entre na BiodoraIA com sua conta Google. No primeiro acesso, o cadastro é concluído automaticamente com nome e turma.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<MockUser | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogleMock();
      if (user.profileCompleted) {
        navigate({ to: "/chat" });
        return;
      }
      setPendingUser(user);
    } catch {
      setError("Não foi possível concluir o acesso. Tente novamente.");
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] size-[26rem] rounded-full bg-accent/10 blur-[120px]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link
            to="/"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
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
            Login e cadastro no mesmo lugar. Use sua conta Google — se for o primeiro acesso,
            pedimos apenas <strong className="font-semibold text-foreground">nome</strong> e{" "}
            <strong className="font-semibold text-foreground">turma</strong>.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className={cn(
              "group mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-secondary px-6 py-3.5",
              "text-sm font-semibold text-foreground transition-all duration-300",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/80 hover:shadow-glow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none",
            )}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            ) : (
              <GoogleIcon className="size-5 transition-transform duration-300 group-hover:scale-110" />
            )}
            {loading ? "Conectando..." : "Continuar com Google"}
          </button>

          {error ? (
            <p role="alert" className="mt-3 text-center text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <ul className="mt-7 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Sem senha para lembrar. Um único botão para entrar ou se cadastrar.</span>
            </li>
            <li className="flex gap-3">
              <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Cadastro automático no primeiro acesso, com nome e turma.</span>
            </li>
          </ul>

          <p className="mt-6 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            Protótipo de interface: a autenticação real com Google está{" "}
            <strong className="font-semibold text-foreground">em desenvolvimento</strong>. Este
            fluxo é simulado apenas para teste.
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            to="/"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Voltar para a página inicial
          </Link>
        </p>
      </div>

      <ProfileDialog
        open={pendingUser !== null}
        defaultName={pendingUser?.name ?? ""}
        onCompleted={() => {
          setPendingUser(null);
          navigate({ to: "/chat" });
        }}
      />
    </main>
  );
}
