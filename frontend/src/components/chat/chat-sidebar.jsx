import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Search, NotebookPen, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
function groupByDate(conversations) {
  const day = 86_400_000;
  const now = Date.now();
  const groups = {
    Hoje: [],
    Ontem: [],
    "Últimos 7 dias": [],
    Anteriores: [],
  };
  for (const conversation of conversations) {
    const diff = now - new Date(conversation.updatedAt).getTime();
    if (diff < day) groups["Hoje"].push(conversation);
    else if (diff < 2 * day) groups["Ontem"].push(conversation);
    else if (diff < 7 * day) groups["Últimos 7 dias"].push(conversation);
    else groups["Anteriores"].push(conversation);
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}
export function ChatSidebar({ onNavigate }) {
  const { conversations, createConversation, loading } = useChatStore();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const filtered = useMemo(
    () =>
      conversations
        .filter((conversation) =>
          conversation.title.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations, query],
  );
  const handleNew = async () => {
    const id = await createConversation();
    onNavigate?.();
    navigate({ to: "/chat/$conversationId", params: { conversationId: id } });
  };
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          to="/app"
          className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
      </div>

      <div className="px-3">
        <Button
          onClick={handleNew}
          className="w-full justify-start gap-2 rounded-xl bg-primary/15 text-foreground ring-1 ring-primary/30 transition-colors hover:bg-primary/25"
        >
          <MessageSquarePlus className="size-4 text-primary" />
          Nova conversa
        </Button>
      </div>

      <nav className="mt-4 space-y-1 px-3" aria-label="Ferramentas da conversa">
        <Link
          to="/app/notebooks"
          onClick={onNavigate}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <NotebookPen className="size-4" />
          Meus notebooks
        </Link>
        <button
          type="button"
          onClick={() => setSearching((value) => !value)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-expanded={searching}
        >
          {searching ? <X className="size-4" /> : <Search className="size-4" />}
          Pesquisar conversas
        </button>
      </nav>

      {searching ? (
        <div className="px-3 pt-2">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título..."
            className="h-9 rounded-lg bg-secondary/60"
          />
        </div>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded-lg bg-secondary/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
        ) : (
          groupByDate(filtered).map(([label, items]) => (
            <div key={label} className="mb-4">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {label}
              </p>
              <ul className="space-y-0.5">
                {items.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      to="/chat/$conversationId"
                      params={{ conversationId: conversation.id }}
                      onClick={onNavigate}
                      className={cn(
                        "block truncate rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                        params.conversationId === conversation.id &&
                          "bg-sidebar-accent text-foreground",
                      )}
                    >
                      {conversation.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <UserMenu />
      </div>
    </div>
  );
}
