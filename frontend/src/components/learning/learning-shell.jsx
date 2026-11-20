import { Link, Outlet } from "@tanstack/react-router";
import { CalendarDays, ClipboardCheck, FileQuestion, Globe, Library } from "lucide-react";
import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { PlatformLayout } from "@/components/layout/platform-layout";

const links = [
  { to: "/app", label: "Visão geral", icon: Globe, exact: true },
  { to: "/app/diagnostic", label: "Diagnóstico", icon: ClipboardCheck },
  { to: "/app/simulado", label: "Simulados", icon: FileQuestion },
  { to: "/app/plans", label: "Plano de estudos", icon: CalendarDays },
  { to: "/app/reds", label: "REDs", icon: Library },
];

export function LearningShell() {
  return (
    <PlatformLayout
      renderHeader={(header) => <AuthenticatedHeader activeArea="studies" {...header} />}
      sidebar={(onNavigate) => (
        <nav className="platform-sidebar-nav" aria-label="Área de estudos">
          {links.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              activeOptions={{ exact: exact ?? false, includeSearch: false }}
              aria-label={label}
              title={label}
              className="platform-sidebar-link"
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="platform-sidebar-label">{label}</span>
            </Link>
          ))}
        </nav>
      )}
    >
      <Outlet />
    </PlatformLayout>
  );
}
