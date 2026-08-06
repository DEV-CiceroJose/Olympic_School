import { notebookRepository } from "@/services/notebook-repository";
export const notebookService = {
  async list() {
    return (await notebookRepository.list()).map((notebook) => ({
      id: notebook.id,
      name: notebook.title,
      description: notebook.description,
    }));
  },
};
