import { BookmarkPlus, Copy, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { toast } from "sonner";
import { artifactLabels, isArtifactMode } from "@/domain/artifacts";
import { artifactRepository } from "@/services/artifact-repository";
import { cn } from "@/lib/utils";
function AssistantAvatar() {
  return (
    <span aria-hidden="true" className="mt-0.5 grid size-9 shrink-0 place-items-center">
      <img
        src="/brand/olympic-school-mark.png"
        width="36"
        height="36"
        alt=""
        className="size-9 object-contain"
      />
    </span>
  );
}
export function MessageBubble({ message, onRetry }) {
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
  const artifactMode = isArtifactMode(message.mode) ? message.mode : null;
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
              "chat-markdown max-w-none text-sm text-foreground sm:text-[0.9375rem]",
              message.status === "error" && "text-destructive",
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {message.content}
            </ReactMarkdown>
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
            {message.status === "completed" && artifactMode ? (
              <button
                type="button"
                onClick={async () => {
                  await artifactRepository.save({
                    id: `artifact-${message.id}`,
                    kind: artifactMode,
                    title: `${artifactLabels[artifactMode]} — ${new Date(message.createdAt).toLocaleDateString("pt-BR")}`,
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
