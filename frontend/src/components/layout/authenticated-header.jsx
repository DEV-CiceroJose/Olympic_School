import { Link } from "@tanstack/react-router";
import { PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";
export function AuthenticatedHeader({ activeArea, onOpenSidebar, actions }) {
  return (
    <header className="platform-header grid min-h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-3 md:px-5">
      <div className="flex min-w-0 items-center">
        {onOpenSidebar ? (
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Abrir menu"
            className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
          >
            <PanelsTopLeft className="size-5" />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Alternar área da aplicação"
        className="platform-area-switch flex items-center rounded-full"
      >
        <Link
          to="/app"
          aria-current={activeArea === "studies" ? "page" : undefined}
          className={cn(
            "platform-area-link flex items-center justify-center rounded-full px-3 font-display font-medium transition-colors sm:px-5",
            activeArea === "studies" && "platform-area-active",
          )}
        >
          Estudos
        </Link>
        <Link
          to="/chat"
          aria-current={activeArea === "assistant" ? "page" : undefined}
          className={cn(
            "platform-area-link flex items-center justify-center rounded-full px-3 font-display font-medium transition-colors sm:px-5",
            activeArea === "assistant" && "platform-area-active",
          )}
        >
          Assistente
        </Link>
      </nav>

      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">{actions}</div>
    </header>
  );
}
