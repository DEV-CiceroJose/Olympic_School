import { describe, expect, it } from "vitest";
import { buildContentParts, buildPrompt } from "./firebaseAiLogic";

describe("Firebase AI Logic prompt policy", () => {
  it("inclui a instrução do modo solicitado", () => {
    expect(buildPrompt("Explique mitose", "summary")).toContain("Gere um resumo");
    expect(buildPrompt("Explique mitose", "summary")).toContain("Explique mitose");
  });

  it("recusa mensagem vazia", () => {
    expect(() => buildPrompt("   ")).toThrow("EMPTY_MESSAGE");
  });

  it("limita o tamanho do contexto enviado", () => {
    expect(() => buildPrompt("a".repeat(12_001))).toThrow("MESSAGE_TOO_LONG");
  });

  it("inclui um anexo válido no pedido multimodal", () => {
    const parts = buildContentParts("Analise o material", "tutor", [
      {
        id: "file-1",
        name: "material.txt",
        size: 8,
        type: "text/plain",
        data: "QmlvbG9naWE=",
      },
    ]);
    expect(parts).toHaveLength(2);
    expect(parts[1]).toMatchObject({ inlineData: { mimeType: "text/plain" } });
  });
});
