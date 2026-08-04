const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
export const MAX_TOTAL_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "text/plain", "text/markdown"]);
function normalizedType(file) {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "md" || extension === "markdown") return "text/markdown";
  if (extension === "txt") return "text/plain";
  return file.type;
}
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}
export const fileService = {
  async upload(file) {
    const type = normalizedType(file);
    if (!ALLOWED_TYPES.has(type)) {
      throw new Error("Envie somente arquivos PDF, TXT ou Markdown.");
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      throw new Error("O arquivo deve ter no máximo 10 MB.");
    }
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type,
      data: await readAsBase64(file),
    };
  },
  async uploadMany(files, existingAttachments = []) {
    const selectedFiles = Array.from(files ?? []);
    if (existingAttachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
      throw new Error(`Você pode enviar no máximo ${MAX_ATTACHMENTS} anexos por mensagem.`);
    }
    const totalSize = [...existingAttachments, ...selectedFiles].reduce(
      (sum, item) => sum + item.size,
      0,
    );
    if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
      throw new Error("O conjunto de anexos deve ter no máximo 20 MB.");
    }
    return Promise.all(selectedFiles.map((file) => this.upload(file)));
  },
};
