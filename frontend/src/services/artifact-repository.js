import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
export const artifactRepository = {
  async list() {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
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
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Faça login para salvar o artefato.");
    const data = {
      type: artifact.kind,
      title: artifact.title.slice(0, 160),
      content: artifact.content.slice(0, 50_000),
      createdAt: serverTimestamp(),
    };
    if (artifact.sourceConversationId) data.sourceConversationId = artifact.sourceConversationId;
    await setDoc(doc(db, "users", uid, "artifacts", artifact.id), data);
  },
  async has(id) {
    return (await this.list()).some((artifact) => artifact.id === id);
  },
};
