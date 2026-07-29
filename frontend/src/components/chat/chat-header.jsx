import { LogOut, MoreHorizontal } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { NotebookSelect } from "./notebook-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
export function ChatHeader({ onOpenSidebar }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <AuthenticatedHeader
      activeArea="assistant"
      onOpenSidebar={onOpenSidebar}
      actions={
        <>
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
        </>
      }
    />
  );
}
