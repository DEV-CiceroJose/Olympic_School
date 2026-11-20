import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Composer } from "@/components/chat/composer";
import { useAuth } from "@/components/auth/auth-provider";
import { useChatStore } from "@/hooks/use-chat-store";
export const Route = createFileRoute("/chat/")({
  component: ChatWelcome,
});
const SUGGESTIONS = [
  { label: "Resumo de citologia", prompt: "Faça um resumo de citologia para OBB." },
  {
    label: "Explicar genética",
    prompt: "Explique genética mendeliana em nível de olimpíada.",
  },
  {
    label: "Questões comentadas",
    prompt: "Gere 5 questões comentadas sobre ecologia.",
  },
  {
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
    <main className="platform-chat-welcome">
      <div className="platform-chat-welcome-content">
        <div className="platform-chat-greeting">
          <h1>Olá, {firstName}</h1>
          <p>Como posso ajudar nos seus estudos de Biologia hoje?</p>
        </div>

        <Composer
          autoFocus={false}
          streaming={Boolean(streamingId)}
          onStop={stop}
          onSend={({ text, mode, attachments }) => void start({ text, mode, attachments })}
        />

        <div className="platform-chat-suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => void start({ text: suggestion.prompt })}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
