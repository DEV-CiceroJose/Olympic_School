import { describe, expect, it } from "vitest";
import { validateAssessmentImport } from "./assessment-spreadsheet";

function assessment(overrides = {}) {
  return {
    codigo_avaliacao: "diagnostico-inicial-obb-v1",
    titulo: "Diagnóstico inicial OBB",
    tipo: "diagnostico_inicial",
    versao: "1",
    quantidade_questoes: "25",
    tempo_minimo_minutos: "30",
    tempo_maximo_minutos: "90",
    ativa: "SIM",
    observacoes: "",
    __row: 2,
    ...overrides,
  };
}

function questions(count = 25) {
  return Array.from({ length: count }, (_, index) => ({
    codigo_avaliacao: "diagnostico-inicial-obb-v1",
    questao_id: `obb-2020-f1-q${index + 1}`,
    ordem: String(index + 1),
    ano_prova: "2020",
    fase: "1",
    numero_original: String(index + 1),
    area: "Citologia",
    habilidade_id: "identificar-celulas",
    habilidade: "Identificar células",
    dificuldade: "2",
    enunciado: `Enunciado válido ${index + 1}`,
    texto_apoio: "",
    imagem_url: "",
    alternativa_a: "Alternativa A",
    alternativa_b: "Alternativa B",
    alternativa_c: "Alternativa C",
    alternativa_d: "Alternativa D",
    alternativa_e: "",
    alternativa_f: "",
    gabarito: "A",
    explicacao: "Explicação do gabarito.",
    fonte_url: "https://example.com/prova.pdf",
    observacoes: "",
    ativa: "SIM",
    __row: index + 2,
  }));
}

describe("assessment spreadsheet validation", () => {
  it("accepts an exact 25-question initial diagnostic", () => {
    const result = validateAssessmentImport(assessment(), questions());
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(25);
  });

  it("rejects partial imports and provisional active questions", () => {
    const rows = questions(24);
    rows[0].enunciado = "QUESTÃO PROVISÓRIA — SUBSTITUIR";
    const result = validateAssessmentImport(assessment(), rows);
    expect(result.errors.some((item) => item.message.includes("25"))).toBe(true);
    expect(result.errors.some((item) => item.message.includes("provisórias"))).toBe(true);
  });

  it("rejects a second phase or out-of-range year", () => {
    const rows = questions();
    rows[0].fase = "2";
    rows[1].ano_prova = "2027";
    const result = validateAssessmentImport(assessment(), rows);
    expect(result.errors.some((item) => item.field === "fase")).toBe(true);
    expect(result.errors.some((item) => item.field === "ano_prova")).toBe(true);
  });
});
