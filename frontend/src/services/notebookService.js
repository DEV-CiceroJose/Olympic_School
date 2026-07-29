import { externalNotebooks } from "@/data/external-notebooks";
export const notebookService = {
  async list() {
    return externalNotebooks
      .filter((notebook) => notebook.isActive)
      .map((notebook) => ({
        id: notebook.id,
        name: notebook.title,
        description: notebook.description,
      }));
  },
};
