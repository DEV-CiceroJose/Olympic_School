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
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

function context() {
  const { auth, db } = getFirebaseRuntime();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return { db, uid };
}

function conversationRef(db, uid, id) {
  return doc(db, "users", uid, "conversations", id);
}

function toIso(value) {
  return value?.toDate?.().toISOString() ?? new Date().toISOString();
}

function normalizeMode(value) {
  return ["assistant", "tutor", "summary", "questions", "flashcards", "mindmap", "study-plan", "review"].includes(value)
    ? value
    : undefined;
}

async function loadMessages(db, uid, conversationId) {
  const snapshot = await getDocs(
    query(
      collection(db, "users", uid, "conversations", conversationId, "messages"),
      orderBy("createdAt", "desc"),
      limit(100),
    ),
  );
  return [...snapshot.docs].reverse().map((item) => {
    const data = item.data();
    return {
      id: item.id,
      role: data.role,
      content: data.content,
      createdAt: toIso(data.createdAt),
      status: data.status,
      mode: normalizeMode(data.mode),
      attachments: [],
    };
  });
}

export const conversationService = Object.freeze({
  async list() {
    const { db, uid } = context();
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
    const { db, uid } = context();
    const snapshot = await getDoc(conversationRef(db, uid, id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      notebookId: data.notebookId,
      updatedAt: toIso(data.updatedAt),
      messages: await loadMessages(db, uid, id),
      messagesLoaded: true,
    };
  },

  async create(input = {}) {
    const { db, uid } = context();
    const reference = doc(collection(db, "users", uid, "conversations"));
    const data = {
      title: String(input.title ?? "").trim().slice(0, 160) || "Nova conversa",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.notebookId) data.notebookId = String(input.notebookId).slice(0, 128);
    await setDoc(reference, data);
    return { id: reference.id, title: data.title, updatedAt: new Date().toISOString(), messages: [] };
  },

  async saveMessage(conversationId, message) {
    const { db, uid } = context();
    const data = {
      role: message.role,
      content: String(message.content ?? "").slice(0, 20_000),
      status: message.status ?? "completed",
      createdAt: serverTimestamp(),
    };
    const mode = normalizeMode(message.mode);
    if (mode) data.mode = mode;
    if (message.attachments?.length) data.attachmentIds = message.attachments.slice(0, 5).map(({ id }) => id);
    await setDoc(doc(db, "users", uid, "conversations", conversationId, "messages", message.id), data);
    await updateDoc(conversationRef(db, uid, conversationId), { updatedAt: serverTimestamp() });
  },

  async updateSummary(conversationId, input) {
    const { db, uid } = context();
    const data = { title: String(input.title).slice(0, 160), updatedAt: serverTimestamp() };
    if (input.notebookId) data.notebookId = String(input.notebookId).slice(0, 128);
    await updateDoc(conversationRef(db, uid, conversationId), data);
  },

  async rename(conversationId, title) {
    const { db, uid } = context();
    await updateDoc(conversationRef(db, uid, conversationId), {
      title: String(title).trim().slice(0, 160) || "Nova conversa",
      updatedAt: serverTimestamp(),
    });
  },

  async clearMessages(conversationId) {
    const { db, uid } = context();
    const snapshot = await getDocs(collection(db, "users", uid, "conversations", conversationId, "messages"));
    for (let index = 0; index < snapshot.docs.length; index += 400) {
      const batch = writeBatch(db);
      snapshot.docs.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
    await updateDoc(conversationRef(db, uid, conversationId), { updatedAt: serverTimestamp() });
  },

  exportMarkdown(conversation) {
    const heading = `# ${conversation.title || "Conversa"}`;
    const messages = (conversation.messages ?? []).map((message) => {
      const author = message.role === "assistant" ? "Olympic School" : "Estudante";
      return `## ${author}\n\n${message.content}`;
    });
    return [heading, ...messages].join("\n\n");
  },

  toSummary(conversation) {
    const { messages: _messages, ...summary } = conversation;
    return summary;
  },
});
