import { BookmarkPlus, Copy, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/chat";
import { artifactLabels, isArtifactMode } from "@/domain/artifacts";
import { artifactRepository } from "@/services/artifact-repository";
import { cn } from "@/lib/utils";

function AssistantAvatar() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/25"
    >
      <svg viewBox="0 0 24 24" className="size-4 text-primary" fill="none">
        <path
          d="M4 20c0-8 6-14 16-14 0 10-6 14-12 14H4Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="7" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

export function MessageBubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry?: () => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] space-y-2 md:max-w-[70%]">
          {message.attachments?.length ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              {message.attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="max-w-52 truncate rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                >
                  {attachment.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const isPending = message.status === "sending" && !message.content;

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        {isPending ? (
          <div className="flex items-center gap-1.5 py-2" aria-live="polite">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="size-2 animate-bounce rounded-full bg-primary/60"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "prose prose-sm prose-invert max-w-none text-foreground",
              "prose-headings:font-display prose-headings:tracking-tight",
              "prose-a:text-primary prose-strong:text-foreground",
              "prose-table:overflow-hidden prose-th:text-left",
              message.status === "error" && "text-destructive",
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.status === "completed" || message.status === "error" ? (
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(message.content);
                toast.success("Resposta copiada.");
              }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Copy className="size-3.5" />
              Copiar
            </button>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
                Tentar novamente
              </button>
            ) : null}
            {message.status === "completed" && isArtifactMode(message.mode) ? (
              <button
                type="button"
                onClick={() => {
                  artifactRepository.save({
                    id: `artifact-${message.id}`,
                    kind: message.mode,
                    title: `${artifactLabels[message.mode]} — ${new Date(message.createdAt).toLocaleDateString("pt-BR")}`,
                    content: message.content,
                    createdAt: new Date().toISOString(),
                  });
                  toast.success("Artefato salvo.");
                }}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <BookmarkPlus className="size-3.5" />
                Salvar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
