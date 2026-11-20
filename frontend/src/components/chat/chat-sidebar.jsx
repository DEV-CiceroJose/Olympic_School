import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";
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
    <>
      <nav className="platform-sidebar-nav" aria-label="Ferramentas da conversa">
        <button
          type="button"
          onClick={handleNew}
          className="platform-sidebar-link platform-sidebar-primary"
        >
          Nova conversa
        </button>
        <button
          type="button"
          onClick={() => setSearching((value) => !value)}
          className="platform-sidebar-link"
          aria-expanded={searching}
        >
          {searching ? <X className="size-4" /> : <Search className="size-4" />}
          Pesquisar conversa
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

      <div className="mt-4 px-3 pb-4">
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
    </>
  );
}
