import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return uid;
}
function conversationRef(uid, id) {
  return doc(db, "users", uid, "conversations", id);
}
function toIso(value) {
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
function toAssistantMode(value) {
  if (
    value === "assistant" ||
    value === "tutor" ||
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
async function loadMessages(uid, conversationId) {
  const snapshot = await getDocs(
    query(
      collection(db, "users", uid, "conversations", conversationId, "messages"),
      orderBy("createdAt", "desc"),
      limit(100),
    ),
  );
  return [...snapshot.docs].reverse().map((message) => {
    const data = message.data();
    return {
      id: message.id,
      role: data.role,
      content: data.content,
      createdAt: toIso(data.createdAt),
      status: data.status,
      mode: toAssistantMode(data.mode),
      attachments: [],
    };
  });
}
export const conversationService = {
  async list() {
    const uid = currentUid();
    const snapshot = await getDocs(
      query(collection(db, "users", uid, "conversations"), orderBy("updatedAt", "desc"), limit(30)),
    );
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        title: data.title,
        notebookId: data.notebookId,
        updatedAt: toIso(data.updatedAt),
        messages: [],
        messagesLoaded: false,
      };
    });
  },
  async get(id) {
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
      messagesLoaded: true,
    };
  },
  async create(input) {
    const uid = currentUid();
    const reference = doc(collection(db, "users", uid, "conversations"));
    const data = {
      title: input?.title?.trim() || "Nova conversa",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input?.notebookId) data.notebookId = input.notebookId;
    await setDoc(reference, data);
    return {
      id: reference.id,
      title: data.title,
      updatedAt: new Date().toISOString(),
      notebookId: input?.notebookId,
      messages: [],
      messagesLoaded: true,
    };
  },
  async saveMessage(conversationId, message) {
    const uid = currentUid();
    const data = {
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
  async updateSummary(conversationId, input) {
    const uid = currentUid();
    const data = {
      title: input.title.slice(0, 160),
      updatedAt: serverTimestamp(),
    };
    if (input.notebookId) data.notebookId = input.notebookId;
    await updateDoc(conversationRef(uid, conversationId), data);
  },
  async rename(conversationId, title) {
    const cleanTitle = title.trim().slice(0, 160);
    if (!cleanTitle) throw new Error("CONVERSATION_TITLE_REQUIRED");
    await updateDoc(conversationRef(currentUid(), conversationId), {
      title: cleanTitle,
      updatedAt: serverTimestamp(),
    });
    return cleanTitle;
  },
  async clearMessages(conversationId) {
    const uid = currentUid();
    const snapshot = await getDocs(
      collection(db, "users", uid, "conversations", conversationId, "messages"),
    );
    for (let index = 0; index < snapshot.docs.length; index += 400) {
      const batch = writeBatch(db);
      for (const message of snapshot.docs.slice(index, index + 400)) batch.delete(message.ref);
      await batch.commit();
    }
    await updateDoc(conversationRef(uid, conversationId), { updatedAt: serverTimestamp() });
  },
  toSummary(conversation) {
    const { messages: _messages, ...summary } = conversation;
    return summary;
  },
};
