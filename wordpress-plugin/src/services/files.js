const MAX_FILE_SIZE = 10 * 1024 * 1024;
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

export const fileService = Object.freeze({
  allowedTypes: [...ALLOWED_TYPES],
  maxFileSize: MAX_FILE_SIZE,

  async prepare(file) {
    const type = normalizedType(file);
    if (!ALLOWED_TYPES.has(type)) throw new Error("Envie somente arquivos PDF, TXT ou Markdown.");
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new Error("O arquivo deve ter no máximo 10 MB.");
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type,
      data: await readAsBase64(file),
    };
  },
});
