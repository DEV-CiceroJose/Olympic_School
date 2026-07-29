import type { Attachment } from "@/types/chat";
import { API_BASE_URL, USE_MOCKS, delay } from "./http";

export const fileService = {
  async upload(file: File): Promise<Attachment> {
    if (!USE_MOCKS) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE_URL}/files`, { method: "POST", body });
      if (!response.ok) throw new Error(`Falha ao enviar arquivo (${response.status}).`);
      return (await response.json()) as Attachment;
    }
    await delay(700);
    return {
      id: `file-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    };
  },
};
