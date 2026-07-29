import { Link, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  Files,
  Library,
  MessageSquare,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { useAuth } from "@/components/auth/auth-provider";
import { useNavigate } from "@tanstack/react-router";

const links = [
  { to: "/app", label: "Visão geral", icon: Sparkles, exact: true },
  { to: "/app/diagnostic", label: "Diagnóstico", icon: ClipboardCheck },
  { to: "/app/training", label: "Treino adaptativo", icon: BrainCircuit },
  { to: "/app/progress", label: "Progresso", icon: BarChart3 },
  { to: "/app/plans", label: "Plano de estudo", icon: CalendarDays },
  { to: "/app/notebooks", label: "Notebooks", icon: Library },
  { to: "/app/artifacts", label: "Artefatos", icon: Files },
  { to: "/chat", label: "Assistente", icon: MessageSquare },
] as const;

export function LearningShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="border-b border-border bg-sidebar p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Logo />
        <nav className="mt-6 flex gap-2 overflow-x-auto md:flex-col" aria-label="Área de estudos">
          {links.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: exact ?? false }}
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground [&.active]:bg-primary/15 [&.active]:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await logout();
            await navigate({ to: "/" });
          }}
          className="mt-4 hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground md:flex"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
          <p className="text-sm font-medium">Treinamento para olimpíadas de Biologia</p>
          <p className="text-xs text-muted-foreground">
            Seu progresso é calculado somente a partir de respostas registradas.
          </p>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
