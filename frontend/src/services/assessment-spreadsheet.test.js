import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  parseAssessmentCsvText,
  parseCsvText,
  serializeCsv,
  validateAssessmentImport,
} from "./assessment-spreadsheet";

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
    alternativa_e: "Alternativa E",
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
  it("reads the delivered semicolon-separated CSV template", () => {
    const text = readFileSync(
      new URL("../../public/templates/modelo-avaliacoes-olympic-school.csv", import.meta.url),
      "utf8",
    );
    const result = parseAssessmentCsvText(text);
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(10);
    expect(result.assessment.type).toBe("simulado");
    expect(result.warnings).toHaveLength(10);

    const legacyCsv = text
      .replace(';"tempo_maximo_minutos"', ';"tempo_minimo_minutos";"tempo_maximo_minutos"')
      .replaceAll(';"10";"90";', ';"10";"30";"90";');
    const legacy = parseAssessmentCsvText(legacyCsv);
    expect(legacy.errors).toEqual([]);
    expect(legacy.assessment).toEqual(result.assessment);
  });

  it("preserves semicolons, quotes and line breaks inside quoted fields", () => {
    const csv = serializeCsv(["id", "texto"], [{ id: "q1", texto: 'Linha 1; "citada"\nLinha 2' }]);
    expect(parseCsvText(csv)).toEqual([
      ["id", "texto"],
      ["q1", 'Linha 1; "citada"\nLinha 2'],
    ]);
  });

  it("neutralizes spreadsheet formulas in exported text", () => {
    const csv = serializeCsv(["texto"], [{ texto: '=HYPERLINK("https://example.com")' }]);
    expect(csv).toContain("'=HYPERLINK");
  });

  it("accepts an exact 25-question initial diagnostic", () => {
    const result = validateAssessmentImport(assessment(), questions());
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(25);
    expect(result.assessment).toMatchObject({ maxMinutes: 90 });
    expect(result.assessment).not.toHaveProperty("minMinutes");
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

  it("accepts up to 30 questions and blocks a 31-question simulation", () => {
    const metadata = assessment({ tipo: "simulado", quantidade_questoes: "30" });
    expect(validateAssessmentImport(metadata, questions(30)).errors).toEqual([]);
    const result = validateAssessmentImport(
      { ...metadata, quantidade_questoes: "31" },
      questions(31),
    );
    expect(result.errors.some((item) => item.field === "quantidade_questoes")).toBe(true);
  });

  it("requires A through E and rejects an additional F alternative", () => {
    const rows = questions();
    rows[0].alternativa_e = "";
    rows[1].alternativa_f = "Sexta";
    rows[1].gabarito = "F";
    const result = validateAssessmentImport(assessment(), rows);
    expect(result.errors.filter((item) => item.field === "alternativa_a")).toHaveLength(2);
    expect(result.errors.some((item) => item.field === "gabarito")).toBe(true);
  });

  it("allows blank origin fields but still rejects invalid provided values", () => {
    const rows = questions();
    rows[0].ano_prova = "";
    rows[0].numero_original = "";
    const valid = validateAssessmentImport(assessment(), rows);
    expect(valid.errors).toEqual([]);
    expect(valid.questions[0]).toMatchObject({ examYear: null, originalNumber: null });
    rows[0].numero_original = "abc";
    expect(
      validateAssessmentImport(assessment(), rows).errors.some(
        (item) => item.field === "numero_original",
      ),
    ).toBe(true);
  });
});
