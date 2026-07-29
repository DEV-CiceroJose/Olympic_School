import { MoreHorizontal, PanelsTopLeft } from "lucide-react";
import { NotebookSelect } from "./notebook-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-background/80 px-3 py-3 backdrop-blur-xl md:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Abrir menu"
        className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      >
        <PanelsTopLeft className="size-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate font-display text-base font-semibold tracking-tight">BiodoraIA</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/12 px-2 py-0.5 text-xs text-primary ring-1 ring-primary/25">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Ativo
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:block">
          <NotebookSelect />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Opções da conversa"
            className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Renomear conversa</DropdownMenuItem>
            <DropdownMenuItem>Exportar conversa</DropdownMenuItem>
            <DropdownMenuItem>Limpar mensagens</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
