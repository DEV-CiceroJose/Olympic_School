import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { buildAssessmentImportKit, assessmentImportKitZip } from "./assessment-import-kit";
import { parseAssessmentCsvText, ASSESSMENT_CSV_HEADERS } from "./assessment-spreadsheet";
import { assessmentImportToDraft, buildEditorAssessment } from "@/domain/assessment-editor";

describe("teacher CSV preparation and correction workflow", () => {
  it("delivers a ZIP with a simulation template, complete field guide and matching AI prompt", () => {
    const kit = buildAssessmentImportKit("simulado", 30);
    const files = unzipSync(assessmentImportKitZip(kit));
    expect(Object.keys(files)).toEqual([
      "modelo.csv",
      "REGRAS-DE-IMPORTACAO.txt",
      "PROMPT-PARA-IA.txt",
    ]);
    const parsed = parseAssessmentCsvText(strFromU8(files["modelo.csv"]));
    expect(parsed.errors).toEqual([]);
    expect(parsed.assessment).toMatchObject({ type: "simulado", questionCount: 30 });
    expect(parsed.questions).toHaveLength(30);
    for (const field of ASSESSMENT_CSV_HEADERS) expect(kit.instructions).toContain(field);
    expect(kit.prompt).toContain("tipo=simulado; quantidade_questoes=30");

    for (const filename of ["REGRAS-DE-IMPORTACAO.txt", "PROMPT-PARA-IA.txt"]) {
      const guidance = strFromU8(files[filename]);
      expect(guidance).toContain("PDF, DOCX");
      expect(guidance).toContain("data:image/webp;base64,");
      expect(guidance).toContain("100000 caracteres");
      expect(guidance).toContain("2 MB");
      expect(guidance).toContain("[IMAGEM_PENDENTE]");
    }
  });

  it("always generates 25-question diagnostics and rejects an oversized simulation", () => {
    const kit = buildAssessmentImportKit("diagnostico_final", 30);
    const result = parseAssessmentCsvText(kit.csv);
    expect(result.errors).toEqual([]);
    expect(result.assessment).toMatchObject({ maxMinutes: 90 });
    expect(result.rawRecords[0]).not.toHaveProperty("tempo_minimo_minutos");
    expect(kit.prompt).toContain("tempo_maximo_minutos=90");
    expect(kit.count).toBe(25);
    expect(() => buildAssessmentImportKit("simulado", 31)).toThrow("1 e 30");
  });

  it("opens invalid text in the editor without silently truncating it", () => {
    const kit = buildAssessmentImportKit("simulado", 10);
    const text = "Habilidade longa ".repeat(10);
    const parsed = parseAssessmentCsvText(kit.csv.replaceAll("Habilidade provisória", text));
    expect(
      parsed.errors.some(
        (item) => item.field === "habilidade" && item.message.includes("limite é 120"),
      ),
    ).toBe(true);
    expect(assessmentImportToDraft(parsed).questions[0].skillLabel).toBe(text.trim());
  });

  it("keeps the gabarito aligned when intermediate alternatives are empty", () => {
    const parsed = parseAssessmentCsvText(
      buildAssessmentImportKit().csv.replaceAll('"Alternativa B provisória"', '""'),
    );
    const draft = assessmentImportToDraft(parsed);
    expect(draft.questions[0].options).toEqual([
      "Alternativa A provisória",
      "",
      "Alternativa C provisória",
      "Alternativa D provisória",
      "Alternativa E provisória",
    ]);
  });

  it("blocks a required figure until it is added to the imported draft", () => {
    const kit = buildAssessmentImportKit("simulado", 1);
    const parsed = parseAssessmentCsvText(kit.csv);
    const draft = assessmentImportToDraft(parsed);
    Object.assign(draft.questions[0], {
      area: "Citologia",
      skillLabel: "Identificar organelas",
      prompt: "Identifique a estrutura da figura.",
      notes: "[IMAGEM_PENDENTE] Prova 2020, página 2, questão 1.",
    });
    expect(buildEditorAssessment(draft).errors).toContainEqual(
      expect.objectContaining({ field: "imagem_url" }),
    );
    draft.questions[0].imageUrl = "data:image/webp;base64,UklGRg==";
    expect(buildEditorAssessment(draft).errors).toEqual([]);
  });

  it("rejects malformed CSV structure before transferring any content", () => {
    const csv = buildAssessmentImportKit("simulado", 1).csv;
    expect(
      parseAssessmentCsvText(csv.replace('"titulo"', '"codigo_avaliacao"')).errors.length,
    ).toBeGreaterThan(0);
    const result = parseAssessmentCsvText(csv + ';"célula extra"');
    expect(result.rawRecords).toBeUndefined();
    expect(result.errors[0].message).toContain("células");
    expect(() => assessmentImportToDraft(result)).toThrow("cabeçalho válido");
  });
});
