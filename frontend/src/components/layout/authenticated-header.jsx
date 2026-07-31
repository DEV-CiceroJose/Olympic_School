import { Link } from "@tanstack/react-router";
import { GraduationCap, MessageSquareText, PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/landing/logo";
export function AuthenticatedHeader({ activeArea, onOpenSidebar, actions }) {
  return (
    <header className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur-xl md:px-5">
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
        <Logo className="hidden lg:block" />
      </div>

      <nav
        aria-label="Alternar área da aplicação"
        className="flex items-center rounded-full bg-secondary/70 p-1 ring-1 ring-border"
      >
        <Link
          to="/app"
          aria-current={activeArea === "studies" ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4",
            activeArea === "studies" && "bg-card text-foreground shadow-sm",
          )}
        >
          <GraduationCap className="hidden size-4 sm:block" />
          Estudos
        </Link>
        <Link
          to="/chat"
          aria-current={activeArea === "assistant" ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4",
            activeArea === "assistant" && "bg-card text-foreground shadow-sm",
          )}
        >
          <MessageSquareText className="hidden size-4 sm:block" />
          Assistente
        </Link>
      </nav>

      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">{actions}</div>
    </header>
  );
}
