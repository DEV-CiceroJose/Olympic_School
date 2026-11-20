import { describe, expect, it, vi } from "vitest";
import {
  buildContentParts,
  buildPrompt,
  reviewDiscursiveAnswer,
  streamOlympicSchoolResponse,
} from "./firebaseAiLogic";

const { appCheckState, getAI, getGenerativeModel } = vi.hoisted(() => ({
  appCheckState: { instance: null },
  getAI: vi.fn(),
  getGenerativeModel: vi.fn(),
}));
vi.mock("firebase/ai", () => ({
  getAI,
  getGenerativeModel,
  GoogleAIBackend: class {},
}));
vi.mock("@/lib/firebase", () => ({
  get appCheck() {
    return appCheckState.instance;
  },
  firebaseApp: {},
}));

describe("Firebase AI Logic App Check", () => {
  it("rejeita a conversa e a correção quando o App Check não foi configurado", async () => {
    await expect(streamOlympicSchoolResponse("Explique mitose").next()).rejects.toThrow(
      "APP_CHECK_NOT_CONFIGURED",
    );
    await expect(reviewDiscursiveAnswer("Minha resposta sobre mitose")).rejects.toThrow(
      "APP_CHECK_NOT_CONFIGURED",
    );
    expect(getAI).not.toHaveBeenCalled();
    expect(getGenerativeModel).not.toHaveBeenCalled();
  });

  it("usa o Firebase AI Logic para a conversa e a correção com App Check configurado", async () => {
    const ai = {};
    const review = { isCorrect: true, score: 1 };
    getAI.mockReturnValue(ai);
    getGenerativeModel.mockReturnValue({
      generateContentStream: async () => ({ stream: [{ text: () => "Resposta" }] }),
      generateContent: async () => ({ response: { text: () => JSON.stringify(review) } }),
    });
    appCheckState.instance = {};
    try {
      await expect(streamOlympicSchoolResponse("Explique mitose").next()).resolves.toEqual({
        value: "Resposta",
        done: false,
      });
      await expect(reviewDiscursiveAnswer("Minha resposta sobre mitose")).resolves.toEqual(review);
      expect(getGenerativeModel).toHaveBeenCalledTimes(2);
      expect(getGenerativeModel).toHaveBeenLastCalledWith(
        ai,
        expect.objectContaining({
          generationConfig: expect.objectContaining({ responseMimeType: "application/json" }),
        }),
      );
    } finally {
      appCheckState.instance = null;
      getAI.mockReset();
      getGenerativeModel.mockReset();
    }
  });
});

describe("Firebase AI Logic prompt policy", () => {
  it("usa a conversa direta como padrão", () => {
    expect(buildPrompt("Explique mitose", "assistant")).toContain("forma direta");
    expect(buildPrompt("Explique mitose")).toContain("forma direta");
  });
  it("inclui a instrução do modo solicitado", () => {
    expect(buildPrompt("Explique mitose", "summary")).toContain("Gere um resumo");
    expect(buildPrompt("Explique mitose", "summary")).toContain("Explique mitose");
  });
  it("combina o texto original com o preset de mapa mental", () => {
    const prompt = buildPrompt("Fotossíntese", "mindmap");
    expect(prompt).toContain("Foco escolhido pelo estudante: Mapa mental");
    expect(prompt).toContain("mapa mental hierárquico");
    expect(prompt).toContain("Solicitação original do estudante:\nFotossíntese");
  });
  it("aplica presets diferentes para tutor e correção discursiva", () => {
    expect(buildPrompt("Explique osmose", "tutor")).toContain("tutor socrático");
    expect(buildPrompt("Corrija minha resposta", "review")).toContain("erros conceituais");
  });
  it("recusa mensagem vazia", () => {
    expect(() => buildPrompt("   ")).toThrow("EMPTY_MESSAGE");
  });
  it("limita o tamanho do contexto enviado", () => {
    expect(() => buildPrompt("a".repeat(12_001))).toThrow("MESSAGE_TOO_LONG");
  });
  it("inclui um anexo válido no pedido multimodal", () => {
    const parts = buildContentParts("Analise o material", "assistant", [
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
