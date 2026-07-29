import { externalNotebooks } from "@/data/external-notebooks";
import type { Notebook } from "@/types/chat";

export const notebookService = {
  async list(): Promise<Notebook[]> {
    return externalNotebooks
      .filter((notebook) => notebook.isActive)
      .map((notebook) => ({
        id: notebook.id,
        name: notebook.title,
        description: notebook.description,
      }));
  },
};
