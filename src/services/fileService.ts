import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import type { Attachment } from "@/types/chat";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "text/plain", "text/markdown"]);

function normalizedType(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "md" || extension === "markdown") return "text/markdown";
  if (extension === "txt") return "text/plain";
  return file.type;
}

function validateFile(file: File) {
  const type = normalizedType(file);
  if (!ALLOWED_TYPES.has(type)) {
    throw new Error("Envie somente arquivos PDF, TXT ou Markdown.");
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("O arquivo deve ter no máximo 10 MB.");
  }
  return type;
}

function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 180);
}

export const fileService = {
  async upload(file: File): Promise<Attachment> {
    const user = auth.currentUser;
    if (!user) throw new Error("Faça login para enviar um arquivo.");

    const type = validateFile(file);
    const id = crypto.randomUUID();
    const storagePath = `users/${user.uid}/uploads/${id}/${safeName(file.name)}`;
    await uploadBytes(ref(storage, storagePath), file, { contentType: type });
    await setDoc(doc(db, "users", user.uid, "uploads", id), {
      ownerId: user.uid,
      fileName: file.name.slice(0, 255),
      fileType: type,
      fileSize: file.size,
      storagePath,
      createdAt: serverTimestamp(),
    });

    return { id, name: file.name, size: file.size, type };
  },
};
