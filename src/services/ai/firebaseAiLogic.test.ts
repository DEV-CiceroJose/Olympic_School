import { describe, expect, it } from "vitest";
import { buildPrompt } from "./firebaseAiLogic";

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
});
