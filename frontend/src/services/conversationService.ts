import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AssistantMode, ChatMessage, Conversation, ConversationSummary } from "@/types/chat";

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return uid;
}

function conversationRef(uid: string, id: string) {
  return doc(db, "users", uid, "conversations", id);
}

function toIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function toAssistantMode(value: unknown): AssistantMode | undefined {
  if (value === "tutor") return "assistant";
  if (
    value === "assistant" ||
    value === "summary" ||
    value === "questions" ||
    value === "flashcards" ||
    value === "mindmap" ||
    value === "study-plan" ||
    value === "review"
  ) {
    return value;
  }
  return undefined;
}

async function loadMessages(uid: string, conversationId: string): Promise<ChatMessage[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "users", uid, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
    ),
  );
  return snapshot.docs.map((message) => {
    const data = message.data();
    return {
      id: message.id,
      role: data.role,
      content: data.content,
      createdAt: toIso(data.createdAt),
      status: data.status,
      mode: toAssistantMode(data.mode),
      attachments: [],
    } as ChatMessage;
  });
}

export const conversationService = {
  async list(): Promise<Conversation[]> {
    const uid = currentUid();
    const snapshot = await getDocs(
      query(collection(db, "users", uid, "conversations"), orderBy("updatedAt", "desc")),
    );
    return Promise.all(
      snapshot.docs.map(async (item) => {
        const data = item.data();
        return {
          id: item.id,
          title: data.title,
          notebookId: data.notebookId,
          updatedAt: toIso(data.updatedAt),
          messages: await loadMessages(uid, item.id),
        } as Conversation;
      }),
    );
  },

  async get(id: string): Promise<Conversation | null> {
    const uid = currentUid();
    const snapshot = await getDoc(conversationRef(uid, id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      notebookId: data.notebookId,
      updatedAt: toIso(data.updatedAt),
      messages: await loadMessages(uid, id),
    };
  },

  async create(input?: { title?: string; notebookId?: string }): Promise<Conversation> {
    const uid = currentUid();
    const reference = doc(collection(db, "users", uid, "conversations"));
    const data: Record<string, unknown> = {
      title: input?.title?.trim() || "Nova conversa",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input?.notebookId) data.notebookId = input.notebookId;
    await setDoc(reference, data);
    return {
      id: reference.id,
      title: data.title as string,
      updatedAt: new Date().toISOString(),
      notebookId: input?.notebookId,
      messages: [],
    };
  },

  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    const uid = currentUid();
    const data: Record<string, unknown> = {
      role: message.role,
      content: message.content,
      status: message.status ?? "completed",
      createdAt: serverTimestamp(),
    };
    if (message.mode) data.mode = message.mode;
    if (message.attachments?.length) data.attachmentIds = message.attachments.map(({ id }) => id);
    await setDoc(
      doc(db, "users", uid, "conversations", conversationId, "messages", message.id),
      data,
    );
    await updateDoc(conversationRef(uid, conversationId), { updatedAt: serverTimestamp() });
  },

  async updateSummary(
    conversationId: string,
    input: { title: string; notebookId?: string },
  ): Promise<void> {
    const uid = currentUid();
    const data: Record<string, unknown> = {
      title: input.title.slice(0, 160),
      updatedAt: serverTimestamp(),
    };
    if (input.notebookId) data.notebookId = input.notebookId;
    await updateDoc(conversationRef(uid, conversationId), data);
  },

  toSummary(conversation: Conversation): ConversationSummary {
    const { messages: _messages, ...summary } = conversation;
    return summary;
  },
};
