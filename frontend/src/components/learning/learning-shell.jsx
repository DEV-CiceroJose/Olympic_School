import { Link, Outlet } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, Globe2, Library } from "lucide-react";
import { Logo } from "@/components/landing/logo";
import { UserMenu } from "@/components/auth/user-menu";
import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
const links = [
  { to: "/app", label: "Visão geral", icon: Globe2, exact: true },
  { to: "/app/diagnostic", label: "Diagnóstico", icon: ClipboardList },
  { to: "/app/plans", label: "Plano de Estudo", icon: CalendarDays },
  { to: "/app/reds", label: "REDs", icon: Library },
];
export function LearningShell() {
  return (
    <div className="platform-theme min-h-screen text-foreground md:flex">
      <aside className="platform-sidebar flex flex-col bg-sidebar md:w-[clamp(12.5rem,22vw,17rem)] md:shrink-0">
        <Link
          to="/app"
          className="platform-sidebar-brand w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo variant="platform" />
        </Link>
        <nav
          className="platform-study-nav flex flex-wrap gap-1 md:flex-1 md:flex-col"
          aria-label="Área de estudos"
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: "exact" in link ? link.exact : false }}
                className="platform-study-link flex shrink-0 items-center gap-2 text-sm transition-colors md:gap-3 md:text-base"
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 hidden border-t border-sidebar-border pt-3 md:block">
          <UserMenu showTeacherLink />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <AuthenticatedHeader
          activeArea="studies"
          actions={<UserMenu compact showTeacherLink className="md:hidden" />}
        />
        <Outlet />
      </div>
    </div>
  );
}
