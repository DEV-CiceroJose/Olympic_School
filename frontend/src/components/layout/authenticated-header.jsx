import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AuthenticatedHeader({ activeArea, controls, profile, actions }) {
  return (
    <header className="platform-header">
      <div className="platform-header-controls">{controls}</div>

      <nav aria-label="Alternar área da aplicação" className="platform-area-switch">
        <Link
          to="/app"
          aria-current={activeArea === "studies" ? "page" : undefined}
          className={cn("platform-area-link", activeArea === "studies" && "platform-area-active")}
        >
          Estudos
        </Link>
        <Link
          to="/chat"
          aria-current={activeArea === "assistant" ? "page" : undefined}
          className={cn("platform-area-link", activeArea === "assistant" && "platform-area-active")}
        >
          Assistente
        </Link>
      </nav>

      <div className="platform-header-right">
        {actions && <div className="platform-header-actions">{actions}</div>}
        <div className="platform-header-profile">{profile}</div>
      </div>
    </header>
  );
}
