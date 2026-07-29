import { mockConversations } from "@/mocks/chat";
import type { Conversation, ConversationSummary } from "@/types/chat";
import { USE_MOCKS, apiFetch, delay } from "./http";

const clone = (conversation: Conversation): Conversation => ({
  ...conversation,
  messages: conversation.messages.map((message) => ({ ...message })),
});

export const conversationService = {
  async list(): Promise<Conversation[]> {
    if (!USE_MOCKS) return apiFetch<Conversation[]>("/conversations");
    await delay(220);
    return mockConversations.map(clone);
  },

  async get(id: string): Promise<Conversation | null> {
    if (!USE_MOCKS) return apiFetch<Conversation>(`/conversations/${id}`);
    await delay(120);
    const found = mockConversations.find((conversation) => conversation.id === id);
    return found ? clone(found) : null;
  },

  async create(input?: { title?: string; notebookId?: string }): Promise<Conversation> {
    if (!USE_MOCKS) {
      return apiFetch<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify(input ?? {}),
      });
    }
    await delay(120);
    return {
      id: `conv-${Math.random().toString(36).slice(2, 9)}`,
      title: input?.title ?? "Nova conversa",
      updatedAt: new Date().toISOString(),
      notebookId: input?.notebookId,
      messages: [],
    };
  },

  toSummary(conversation: Conversation): ConversationSummary {
    const { messages: _messages, ...summary } = conversation;
    return summary;
  },
};
