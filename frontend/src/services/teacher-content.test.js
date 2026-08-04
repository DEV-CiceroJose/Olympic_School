import { describe, expect, it } from "vitest";
import { mergeNotebookCatalog } from "./notebook-repository";
import { mergePromptPreset } from "./prompt-preset-repository";
import { mergeQuestionCatalog } from "./question-repository";

describe("conteúdo gerenciado pelo professor", () => {
  it("mantém o banco padrão e aplica uma questão remota como substituição", () => {
    const questions = mergeQuestionCatalog([
      {
        id: "cell-01",
        area: "Citologia",
        skillId: "estrutura_celular",
        skillLabel: "Estrutura celular",
        prompt: "Questão revisada",
        options: ["A", "B"],
        correctOption: 0,
        explanation: "Explicação revisada",
        difficulty: 2,
        isActive: true,
      },
    ]);
    expect(questions.length).toBeGreaterThan(1);
    expect(questions.find((item) => item.id === "cell-01")?.prompt).toBe("Questão revisada");
  });

  it("oculta itens inativos dos alunos, mas permite listá-los ao professor", () => {
    const remote = [{ id: "notebooklm-home", isActive: false, title: "Oculto" }];
    expect(mergeNotebookCatalog(remote).some((item) => item.id === "notebooklm-home")).toBe(false);
    expect(mergeNotebookCatalog(remote, true).some((item) => item.id === "notebooklm-home")).toBe(
      true,
    );
  });

  it("usa o prompt personalizado sem permitir alterar o nome fixo do foco", () => {
    const preset = mergePromptPreset("mindmap", {
      label: "Nome malicioso",
      description: "Personalizado",
      instruction: "Crie um mapa em árvore com relações explícitas entre todos os conceitos.",
    });
    expect(preset.label).toBe("Mapa mental");
    expect(preset.description).toBe("Personalizado");
    expect(preset.customized).toBe(true);
  });
});
