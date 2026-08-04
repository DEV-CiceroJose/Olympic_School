import { Download, LogOut, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { NotebookSelect } from "./notebook-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useChatStore } from "@/hooks/use-chat-store";

function exportConversation(conversation) {
  const markdown = [
    `# ${conversation.title}`,
    "",
    ...conversation.messages.flatMap((message) => [
      `## ${message.role === "user" ? "Estudante" : "Olympic School"}`,
      "",
      message.content,
      "",
    ]),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${conversation.title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "conversa"}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
export function ChatHeader({ onOpenSidebar }) {
  const { logout } = useAuth();
  const { conversations, renameConversation, clearConversation } = useChatStore();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const activeConversation = conversations.find(
    (conversation) => conversation.id === params.conversationId,
  );
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
              <DropdownMenuItem
                disabled={!activeConversation}
                onSelect={async () => {
                  const title = window.prompt(
                    "Novo título da conversa:",
                    activeConversation?.title ?? "",
                  );
                  if (!title?.trim() || !activeConversation) return;
                  try {
                    await renameConversation(activeConversation.id, title);
                    toast.success("Conversa renomeada.");
                  } catch {
                    toast.error("Não foi possível renomear a conversa.");
                  }
                }}
              >
                <Pencil className="size-4" /> Renomear conversa
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!activeConversation?.messagesLoaded}
                onSelect={() => {
                  if (!activeConversation) return;
                  exportConversation(activeConversation);
                  toast.success("Conversa exportada em Markdown.");
                }}
              >
                <Download className="size-4" /> Exportar conversa
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!activeConversation}
                onSelect={async () => {
                  if (
                    !activeConversation ||
                    !window.confirm("Apagar todas as mensagens desta conversa?")
                  ) {
                    return;
                  }
                  try {
                    await clearConversation(activeConversation.id);
                    toast.success("Mensagens apagadas.");
                  } catch {
                    toast.error("Não foi possível limpar a conversa.");
                  }
                }}
              >
                <Trash2 className="size-4" /> Limpar mensagens
              </DropdownMenuItem>
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
