// Embed optimized raster images in question documents and CSV exports. No external host is needed.
export async function prepareAssessmentImage(file) {
  if (
    !file ||
    !["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/bmp"].includes(
      file.type,
    )
  ) {
    throw new Error("Selecione uma imagem PNG, JPG, WebP, GIF, AVIF ou BMP.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("Selecione uma imagem de até 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("Não foi possível abrir esta imagem. Tente outro arquivo.");
    }
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40_000_000
    ) {
      throw new Error("A imagem é grande demais. Use uma imagem com até 40 megapixels.");
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");
    for (let side = 1600; side >= 400; side = Math.floor(side * 0.8)) {
      const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.75, 0.6]) {
        const dataUrl = canvas.toDataURL("image/webp", quality);
        if (dataUrl.length <= 60_000) return dataUrl;
      }
    }
    throw new Error(
      "Não foi possível reduzir a imagem. Recorte a região importante e tente novamente.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
