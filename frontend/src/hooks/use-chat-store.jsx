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
const ChatContext = createContext(null);
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notebookId, setNotebookId] = useState(null);
  const [streamingId, setStreamingId] = useState(null);
  const abortRef = useRef(null);
  const loadingConversationIdsRef = useRef(new Set());
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
  const patchConversation = useCallback((id, updater) => {
    setConversations((prev) =>
      prev.map((conversation) => (conversation.id === id ? updater(conversation) : conversation)),
    );
  }, []);
  const createConversation = useCallback(async () => {
    const conversation = await conversationService.create({
      notebookId: notebookId ?? undefined,
    });
    setConversations((prev) => [conversation, ...prev]);
    return conversation.id;
  }, [notebookId]);
  const loadConversation = useCallback(async (conversationId) => {
    if (loadingConversationIdsRef.current.has(conversationId)) return;
    loadingConversationIdsRef.current.add(conversationId);
    try {
      const conversation = await conversationService.get(conversationId);
      if (!conversation) {
        setConversations((current) => current.filter((item) => item.id !== conversationId));
        return;
      }
      setConversations((current) =>
        current.map((item) => (item.id === conversationId ? conversation : item)),
      );
    } finally {
      loadingConversationIdsRef.current.delete(conversationId);
    }
  }, []);
  const runAssistant = useCallback(
    async (conversationId, message, mode, attachments) => {
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
      const updateAssistant = (patch) =>
        patchConversation(conversationId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((item) =>
            item.id === assistantId ? { ...item, ...patch } : item,
          ),
        }));
      try {
        let content = "";
        for await (const chunk of assistantService.sendMessage(
          {
            conversationId,
            message,
            mode,
            notebookId: notebookId ?? undefined,
            attachmentIds: attachments?.map(({ id }) => id),
            attachments,
          },
          { signal: controller.signal },
        )) {
          content += chunk;
          updateAssistant({ content, status: "streaming" });
        }
        const completedMessage = {
          id: assistantId,
          role: "assistant",
          content,
          createdAt: new Date().toISOString(),
          status: "completed",
          mode,
        };
        updateAssistant({ status: "completed" });
        await conversationService.saveMessage(conversationId, completedMessage);
      } catch (error) {
        updateAssistant({
          status: "error",
          content: error instanceof Error ? error.message : "Não foi possível gerar a resposta.",
        });
      } finally {
        abortRef.current = null;
        setStreamingId(null);
      }
    },
    [notebookId, patchConversation],
  );
  const sendMessage = useCallback(
    async ({ conversationId, text, mode, attachments }) => {
      const effectiveMode = mode ?? "assistant";
      const userMessage = {
        id: uid("msg"),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
        status: "completed",
        mode: effectiveMode,
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
      const nextTitle = current?.messages.length ? current.title : text.slice(0, 42);
      await conversationService.saveMessage(conversationId, userMessage);
      await conversationService.updateSummary(conversationId, {
        title: nextTitle,
        notebookId: notebookId ?? undefined,
      });
      await runAssistant(conversationId, text, effectiveMode, attachments);
    },
    [conversations, notebookId, patchConversation, runAssistant],
  );
  const renameConversation = useCallback(async (conversationId, title) => {
    const cleanTitle = await conversationService.rename(conversationId, title);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title: cleanTitle, updatedAt: new Date().toISOString() }
          : conversation,
      ),
    );
  }, []);
  const clearConversation = useCallback(async (conversationId) => {
    await conversationService.clearMessages(conversationId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [],
              messagesLoaded: true,
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
    );
  }, []);
  const retry = useCallback(
    async (conversationId) => {
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
      await runAssistant(conversationId, lastUser.content, lastUser.mode, lastUser.attachments);
    },
    [conversations, patchConversation, runAssistant],
  );
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingId(null);
  }, []);
  const value = useMemo(
    () => ({
      conversations,
      notebooks,
      loading,
      notebookId,
      setNotebookId,
      createConversation,
      loadConversation,
      sendMessage,
      retry,
      renameConversation,
      clearConversation,
      streamingId,
      stop,
    }),
    [
      conversations,
      notebooks,
      loading,
      notebookId,
      createConversation,
      loadConversation,
      sendMessage,
      retry,
      renameConversation,
      clearConversation,
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
