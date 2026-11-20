import { describe, expect, it } from "vitest";
import {
  buildEditorAssessment,
  createAssessmentDraft,
  createEditorQuestion,
  assessmentDraftSchema,
} from "./assessment-editor";
import { parseAssessmentCsvText } from "@/services/assessment-spreadsheet";

function validDraft() {
  const draft = createAssessmentDraft();
  return {
    ...draft,
    title: 'Simulado; "Biologia"',
    isActive: true,
    questions: [
      {
        ...draft.questions[0],
        examYear: "2020",
        originalNumber: "12",
        area: "Citologia",
        skillLabel: "Identificar células",
        prompt: 'Leia o texto; "célula".\nQual é a resposta?',
        options: ["Primeira", "Segunda", "Terceira", "Quarta", "Quinta"],
        correctOption: "2",
        explanation: "A terceira alternativa descreve a célula.",
      },
    ],
  };
}

describe("visual assessment editor CSV compatibility", () => {
  it("exports a complete assessment that the existing importer can read without losing content", () => {
    const draft = validDraft();
    const result = buildEditorAssessment(draft);
    expect(result.errors).toEqual([]);
    const imported = parseAssessmentCsvText(result.csv);
    expect(imported.errors).toEqual([]);
    expect(imported.assessment).toMatchObject({
      title: draft.title,
      type: "simulado",
      questionCount: 1,
      isActive: true,
    });
    expect(imported.questions[0]).toMatchObject({
      id: draft.questions[0].id,
      prompt: draft.questions[0].prompt,
      skillId: "identificar-celulas",
      options: draft.questions[0].options,
      correctOption: 2,
      phase: 1,
    });
  });

  it("keeps question identities and answer keys when questions are reordered", () => {
    const draft = validDraft();
    const second = { ...draft.questions[0], id: createEditorQuestion().id, correctOption: "0" };
    draft.questions = [second, draft.questions[0]];
    const result = buildEditorAssessment(draft);
    expect(result.errors).toEqual([]);
    expect(
      result.questions.map(({ id, order, correctOption }) => ({ id, order, correctOption })),
    ).toEqual([
      { id: second.id, order: 1, correctOption: 0 },
      { id: draft.questions[1].id, order: 2, correctOption: 2 },
    ]);
  });

  it("blocks empty intermediate alternatives instead of silently shifting the correct answer", () => {
    const draft = validDraft();
    draft.questions[0].options[1] = "  ";
    expect(buildEditorAssessment(draft).errors).toContainEqual(
      expect.objectContaining({ row: 2, field: "alternativa_b" }),
    );
  });

  it("requires a selected answer and reuses diagnostic quantity and timing rules", () => {
    const draft = validDraft();
    draft.type = "diagnostico_final";
    draft.maxMinutes = "75";
    draft.questions[0].correctOption = "";
    const result = buildEditorAssessment(draft);
    const fields = result.errors.map((item) => item.field);
    expect(fields).toEqual(
      expect.arrayContaining(["quantidade_questoes", "tempo_maximo_minutos", "gabarito"]),
    );
  });

  it("does not allow publishing an empty draft", () => {
    expect(buildEditorAssessment(createAssessmentDraft()).errors.length).toBeGreaterThan(0);
  });

  it("rejects alternatives that exceed the database limit", () => {
    const draft = validDraft();
    draft.questions[0].options[0] = "a".repeat(501);
    expect(buildEditorAssessment(draft).errors).toContainEqual(
      expect.objectContaining({ row: 2, field: "alternativa_a" }),
    );
  });

  it("accepts incomplete drafts and rejects corrupt locally stored drafts", () => {
    expect(assessmentDraftSchema.safeParse(createAssessmentDraft()).success).toBe(true);
    expect(assessmentDraftSchema.safeParse({ questions: [{ options: [] }] }).success).toBe(false);
  });

  it("preserves original questions and uploaded images through CSV export and import", () => {
    const draft = validDraft();
    draft.questions[0].examYear = "";
    draft.questions[0].originalNumber = "";
    draft.questions[0].correctOption = "4";
    draft.questions[0].imageUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=";
    const result = buildEditorAssessment(draft);
    expect(result.errors).toEqual([]);
    expect(parseAssessmentCsvText(result.csv).questions[0]).toMatchObject({
      examYear: null,
      originalNumber: null,
      imageUrl: draft.questions[0].imageUrl,
      correctOption: 4,
    });
  });

  it("adds the fifth alternative when recovering an earlier four-option draft", () => {
    const draft = validDraft();
    draft.questions[0].options.pop();
    const restored = assessmentDraftSchema.parse(draft);
    expect(restored.questions[0].options).toEqual([
      "Primeira",
      "Segunda",
      "Terceira",
      "Quarta",
      "",
    ]);
    expect(buildEditorAssessment(restored).errors.length).toBeGreaterThan(0);
  });
});
