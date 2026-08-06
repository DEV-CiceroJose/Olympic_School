import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Composer } from "@/components/chat/composer";
import { MessageList } from "@/components/chat/message-list";
import { useChatStore } from "@/hooks/use-chat-store";
export const Route = createFileRoute("/chat/$conversationId")({
  component: ConversationPage,
});
function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { conversations, loading, loadConversation, sendMessage, retry, streamingId, stop } =
    useChatStore();
  const conversation = conversations.find((item) => item.id === conversationId);
  useEffect(() => {
    if (conversation && !conversation.messagesLoaded) void loadConversation(conversationId);
  }, [conversation, conversationId, loadConversation]);
  if (loading || (conversation && !conversation.messagesLoaded)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-secondary/50" />
        ))}
      </main>
    );
  }
  if (!conversation) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="text-muted-foreground">Conversa não encontrada.</p>
      </main>
    );
  }
  return (
    <main className="flex min-h-0 flex-1 flex-col" key={conversation.id}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="text-muted-foreground">
              Envie a primeira mensagem para começar esta conversa.
            </p>
          </div>
        ) : (
          <MessageList
            messages={conversation.messages}
            onRetry={() => void retry(conversation.id)}
          />
        )}
      </div>

      <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur-xl md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Composer
            streaming={Boolean(streamingId)}
            onStop={stop}
            onSend={({ text, mode, attachments }) =>
              void sendMessage({ conversationId: conversation.id, text, mode, attachments })
            }
          />
        </div>
      </div>
    </main>
  );
}
