import {
  Bot,
  Check,
  ChevronDown,
  GraduationCap,
  LogOut,
  MoreHorizontal,
  PanelsTopLeft,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { NotebookSelect } from "./notebook-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useChatStore } from "@/hooks/use-chat-store";

export function ChatHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { logout } = useAuth();
  const { experienceMode, setExperienceMode } = useChatStore();
  const navigate = useNavigate();
  const isTutor = experienceMode === "tutor";

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
        <h1 className="hidden truncate font-display text-base font-semibold tracking-tight sm:block">
          BiodoraIA
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {isTutor ? (
              <GraduationCap className="size-4 shrink-0 text-primary" />
            ) : (
              <Bot className="size-4 shrink-0 text-primary" />
            )}
            <span className="truncate">{isTutor ? "Tutor" : "Assistente"}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>
              <span className="block text-sm">Modo da conversa</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Você pode trocar a qualquer momento.
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setExperienceMode("assistant")}
              className="items-start py-2.5"
            >
              <Bot className="mt-0.5 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Assistente</span>
                <span className="block text-xs text-muted-foreground">
                  Respostas diretas, organização e criação de materiais.
                </span>
              </span>
              {!isTutor ? <Check className="mt-0.5 text-primary" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setExperienceMode("tutor")}
              className="items-start py-2.5"
            >
              <GraduationCap className="mt-0.5 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Tutor</span>
                <span className="block text-xs text-muted-foreground">
                  Explicação guiada, conexões e perguntas de checagem.
                </span>
              </span>
              {isTutor ? <Check className="mt-0.5 text-primary" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
                await navigate({ to: "/" });
              }}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
