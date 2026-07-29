import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Brain, ListChecks, Map } from "lucide-react";
import { Composer } from "@/components/chat/composer";
import { NotebookSelect } from "@/components/chat/notebook-select";
import { useAuth } from "@/components/auth/auth-provider";
import { useChatStore } from "@/hooks/use-chat-store";
export const Route = createFileRoute("/chat/")({
  component: ChatWelcome,
});
const SUGGESTIONS = [
  { icon: BookOpen, label: "Resumo de citologia", prompt: "Faça um resumo de citologia para OBB." },
  {
    icon: Brain,
    label: "Explicar genética",
    prompt: "Explique genética mendeliana em nível de olimpíada.",
  },
  {
    icon: ListChecks,
    label: "Questões comentadas",
    prompt: "Gere 5 questões comentadas sobre ecologia.",
  },
  {
    icon: Map,
    label: "Mapa mental",
    prompt: "Monte um mapa mental sobre fisiologia humana.",
  },
];
function ChatWelcome() {
  const { createConversation, sendMessage, streamingId, stop } = useChatStore();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const firstName = (profile?.name || user?.displayName || "Estudante").trim().split(/\s+/)[0];
  const start = async (input) => {
    const conversationId = await createConversation();
    await navigate({ to: "/chat/$conversationId", params: { conversationId } });
    void sendMessage({ conversationId, ...input });
  };
  return (
    <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-primary/12 blur-[140px]"
      />

      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Olá, {firstName}
          </h2>
          <p className="mt-3 text-muted-foreground">
            Como posso ajudar nos seus estudos de Biologia hoje?
          </p>
        </div>

        <Composer
          streaming={Boolean(streamingId)}
          onStop={stop}
          onSend={({ text, mode, attachments }) => void start({ text, mode, attachments })}
        />

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => void start({ text: suggestion.prompt })}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
            >
              <suggestion.icon className="size-4 text-primary" />
              {suggestion.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <NotebookSelect />
        </div>
      </div>
    </main>
  );
}
