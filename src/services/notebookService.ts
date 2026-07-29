import { mockNotebooks } from "@/mocks/chat";
import type { Notebook } from "@/types/chat";
import { USE_MOCKS, apiFetch, delay } from "./http";

export const notebookService = {
  async list(): Promise<Notebook[]> {
    if (!USE_MOCKS) return apiFetch<Notebook[]>("/notebooks");
    await delay(150);
    return mockNotebooks.map((notebook) => ({ ...notebook }));
  },
};
