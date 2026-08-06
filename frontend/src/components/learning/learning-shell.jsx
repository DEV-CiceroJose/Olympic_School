import { Link, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  Files,
  Library,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useAuth } from "@/components/auth/auth-provider";
const links = [
  { to: "/app", label: "Visão geral", icon: Sparkles, exact: true },
  { to: "/app/diagnostic", label: "Diagnóstico", icon: ClipboardCheck },
  { to: "/app/training", label: "Treino adaptativo", icon: BrainCircuit },
  { to: "/app/progress", label: "Progresso", icon: BarChart3 },
  { to: "/app/plans", label: "Plano de estudo", icon: CalendarDays },
  { to: "/app/notebooks", label: "Notebooks", icon: Library },
  { to: "/app/artifacts", label: "Artefatos", icon: Files },
];
export function LearningShell() {
  const { isTeacher } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="border-b border-border bg-sidebar p-4 md:flex md:min-h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
        <Link
          to="/app"
          className="w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
        <nav
          className="mt-6 flex gap-2 overflow-x-auto md:min-h-0 md:flex-1 md:flex-col"
          aria-label="Área de estudos"
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: "exact" in link ? link.exact : false }}
                className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground [&.active]:bg-primary/15 [&.active]:text-primary"
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
          {isTeacher ? (
            <Link
              to="/app/teacher"
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground [&.active]:bg-primary/15 [&.active]:text-primary"
            >
              <ShieldCheck className="size-4" />
              Área do professor
            </Link>
          ) : null}
        </nav>
        <div className="mt-4 hidden border-t border-sidebar-border pt-3 md:block">
          <UserMenu />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <AuthenticatedHeader
          activeArea="studies"
          actions={<UserMenu compact className="md:hidden" />}
        />
        <Outlet />
      </div>
    </div>
  );
}
