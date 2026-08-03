import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

function context() {
  const { auth, db } = getFirebaseRuntime();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("AUTH_REQUIRED");
  return { db, uid };
}

export const artifactRepository = Object.freeze({
  async list() {
    const { db, uid } = context();
    const snapshot = await getDocs(
      query(collection(db, "users", uid, "artifacts"), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        kind: data.type,
        title: data.title,
        content: data.content,
        sourceConversationId: data.sourceConversationId,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      };
    });
  },

  async save(artifact) {
    const { db, uid } = context();
    const data = {
      type: artifact.kind,
      title: String(artifact.title ?? "").slice(0, 160),
      content: String(artifact.content ?? "").slice(0, 50_000),
      createdAt: serverTimestamp(),
    };
    if (artifact.sourceConversationId) data.sourceConversationId = String(artifact.sourceConversationId).slice(0, 128);
    await setDoc(doc(db, "users", uid, "artifacts", artifact.id), data);
  },

  async remove(id) {
    const { db, uid } = context();
    await deleteDoc(doc(db, "users", uid, "artifacts", id));
  },

  async has(id) {
    return (await this.list()).some((artifact) => artifact.id === id);
  },
});
