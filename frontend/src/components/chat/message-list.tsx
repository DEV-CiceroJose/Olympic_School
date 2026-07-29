import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "@/types/chat";

export function MessageList({
  messages,
  onRetry,
}: {
  messages: ChatMessage[];
  onRetry: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onRetry={message.status === "error" ? onRetry : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
