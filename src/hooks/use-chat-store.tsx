import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { assistantService } from "@/services/assistantService";
import { conversationService } from "@/services/conversationService";
import { notebookService } from "@/services/notebookService";
import type { Attachment, AssistantMode, ChatMessage, Conversation, Notebook } from "@/types/chat";

type ChatStore = {
  conversations: Conversation[];
  notebooks: Notebook[];
  loading: boolean;
  notebookId: string | null;
  setNotebookId: (id: string | null) => void;
  createConversation: () => Promise<string>;
  sendMessage: (input: {
    conversationId: string;
    text: string;
    mode?: AssistantMode;
    attachments?: Attachment[];
  }) => Promise<void>;
  retry: (conversationId: string) => Promise<void>;
  streamingId: string | null;
  stop: () => void;
};

const ChatContext = createContext<ChatStore | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([conversationService.list(), notebookService.list()])
      .then(([list, books]) => {
        if (!active) return;
        setConversations(list);
        setNotebooks(books);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const patchConversation = useCallback(
    (id: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((conversation) => (conversation.id === id ? updater(conversation) : conversation)),
      );
    },
    [],
  );

  const createConversation = useCallback(async () => {
    const conversation = await conversationService.create({
      notebookId: notebookId ?? undefined,
    });
    setConversations((prev) => [conversation, ...prev]);
    return conversation.id;
  }, [notebookId]);

  const runAssistant = useCallback(
    async (conversationId: string, message: string, mode?: AssistantMode) => {
      const assistantId = uid("msg");
      const controller = new AbortController();
      abortRef.current = controller;
      setStreamingId(assistantId);

      patchConversation(conversationId, (conversation) => ({
        ...conversation,
        updatedAt: new Date().toISOString(),
        messages: [
          ...conversation.messages,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
            status: "sending",
            mode,
          },
        ],
      }));

      const updateAssistant = (patch: Partial<ChatMessage>) =>
        patchConversation(conversationId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((item) =>
            item.id === assistantId ? { ...item, ...patch } : item,
          ),
        }));

      try {
        let content = "";
        for await (const chunk of assistantService.sendMessage(
          { conversationId, message, mode, notebookId: notebookId ?? undefined },
          { signal: controller.signal },
        )) {
          content += chunk;
          updateAssistant({ content, status: "streaming" });
        }
        const completedMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content,
          createdAt: new Date().toISOString(),
          status: "completed",
          mode,
        };
        updateAssistant({ status: "completed" });
        await conversationService.saveMessage(conversationId, completedMessage);
      } catch {
        updateAssistant({
          status: "error",
          content: "Não foi possível gerar a resposta.",
        });
      } finally {
        abortRef.current = null;
        setStreamingId(null);
      }
    },
    [notebookId, patchConversation],
  );

  const sendMessage = useCallback<ChatStore["sendMessage"]>(
    async ({ conversationId, text, mode, attachments }) => {
      const userMessage: ChatMessage = {
        id: uid("msg"),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
        status: "completed",
        attachments,
      };

      patchConversation(conversationId, (conversation) => ({
        ...conversation,
        title: conversation.messages.length === 0 ? text.slice(0, 42) : conversation.title,
        notebookId: conversation.notebookId ?? notebookId ?? undefined,
        updatedAt: new Date().toISOString(),
        messages: [...conversation.messages, userMessage],
      }));

      const current = conversations.find((conversation) => conversation.id === conversationId);
      await conversationService.saveMessage(conversationId, userMessage);
      await conversationService.updateSummary(conversationId, {
        title:
          current?.messages.length === 0 ? text.slice(0, 42) : (current?.title ?? "Nova conversa"),
        notebookId: notebookId ?? undefined,
      });
      await runAssistant(conversationId, text, mode);
    },
    [conversations, notebookId, patchConversation, runAssistant],
  );

  const retry = useCallback(
    async (conversationId: string) => {
      const conversation = conversations.find((item) => item.id === conversationId);
      if (!conversation) return;
      const lastUser = [...conversation.messages].reverse().find((m) => m.role === "user");
      if (!lastUser) return;
      patchConversation(conversationId, (current) => ({
        ...current,
        messages: current.messages.filter(
          (message) => !(message.role === "assistant" && message.status === "error"),
        ),
      }));
      await runAssistant(conversationId, lastUser.content, lastUser.mode);
    },
    [conversations, patchConversation, runAssistant],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingId(null);
  }, []);

  const value = useMemo<ChatStore>(
    () => ({
      conversations,
      notebooks,
      loading,
      notebookId,
      setNotebookId,
      createConversation,
      sendMessage,
      retry,
      streamingId,
      stop,
    }),
    [
      conversations,
      notebooks,
      loading,
      notebookId,
      createConversation,
      sendMessage,
      retry,
      streamingId,
      stop,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStore() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatStore deve ser usado dentro de ChatProvider");
  return context;
}
