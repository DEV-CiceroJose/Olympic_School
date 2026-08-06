import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { externalNotebooks } from "../data/external-notebooks.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

function normalizeNotebook(id, data) {
  return {
    id,
    title: data.title,
    description: data.description,
    subject: data.subject,
    url: data.url ?? "",
    isActive: data.isActive === true,
    source: data.source ?? "teacher",
  };
}

export function mergeNotebookCatalog(remote = [], includeInactive = false) {
  const catalog = new Map(
    externalNotebooks.map((notebook) => [
      notebook.id,
      normalizeNotebook(notebook.id, { ...notebook, source: "default" }),
    ]),
  );
  remote.forEach((notebook) => catalog.set(notebook.id, notebook));
  return [...catalog.values()].filter((notebook) => includeInactive || notebook.isActive);
}

export const notebookRepository = Object.freeze({
  async list({ includeInactive = false } = {}) {
    try {
      const snapshot = await getDocs(collection(getFirebaseRuntime().db, "externalNotebooks"));
      return mergeNotebookCatalog(
        snapshot.docs.map((item) => normalizeNotebook(item.id, item.data())),
        includeInactive,
      );
    } catch {
      return mergeNotebookCatalog([], includeInactive);
    }
  },
  async save(input) {
    if (![input.title, input.description, input.subject].every((value) => String(value ?? "").trim())) {
      throw new Error("Preencha título, matéria e descrição.");
    }
    if (input.isActive && !/^https:\/\//i.test(String(input.url).trim())) {
      throw new Error("Um notebook ativo precisa de um link HTTPS válido.");
    }
    const { db } = getFirebaseRuntime();
    const reference = doc(db, "externalNotebooks", input.id);
    const existing = await getDoc(reference);
    const data = {
      title: input.title.trim(),
      description: input.description.trim(),
      subject: input.subject.trim(),
      url: String(input.url ?? "").trim(),
      isActive: input.isActive === true,
      source: "teacher",
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(reference, data);
    return normalizeNotebook(input.id, data);
  },
  async remove(id) {
    await deleteDoc(doc(getFirebaseRuntime().db, "externalNotebooks", id));
  },
});
