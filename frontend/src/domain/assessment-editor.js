import {
  ASSESSMENT_CSV_HEADERS,
  parseAssessmentCsvText,
  serializeCsv,
} from "@/services/assessment-spreadsheet";
import { z } from "zod";
import { MAX_ASSESSMENT_IMAGE_LENGTH } from "./assessment-image";

export const assessmentDraftSchema = z.object({
  code: z.string(),
  title: z.string(),
  type: z.enum(["simulado", "diagnostico_inicial", "diagnostico_final"]),
  version: z.string(),
  maxMinutes: z.string(),
  isActive: z.boolean(),
  notes: z.string(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        examYear: z.string(),
        originalNumber: z.string(),
        area: z.string(),
        skillLabel: z.string(),
        difficulty: z.string(),
        prompt: z.string(),
        supportText: z.string(),
        imageUrl: z.string(),
        options: z
          .array(z.string())
          .min(2)
          .max(5)
          .transform((options) => [...options, ...Array(5 - options.length).fill("")]),
        correctOption: z.string(),
        explanation: z.string(),
        sourceUrl: z.string(),
        notes: z.string(),
      }),
    )
    .min(1)
    .max(30),
});

export function editorCode(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function createEditorQuestion() {
  return {
    id: `questao-${crypto.randomUUID()}`,
    examYear: "",
    originalNumber: "",
    area: "",
    skillLabel: "",
    difficulty: "2",
    prompt: "",
    supportText: "",
    imageUrl: "",
    options: ["", "", "", "", ""],
    correctOption: "",
    explanation: "",
    sourceUrl: "",
    notes: "",
  };
}

export function createAssessmentDraft() {
  return {
    code: `simulado-${crypto.randomUUID().slice(0, 8)}`,
    title: "",
    type: "simulado",
    version: "1",
    maxMinutes: "90",
    isActive: false,
    notes: "",
    questions: [createEditorQuestion()],
  };
}

export function assessmentImportToDraft(result) {
  const rows = result.rawRecords;
  if (!rows?.length || rows.length > 30)
    throw new Error(
      "Selecione um CSV com cabeçalho válido e entre 1 e 30 questões para abrir no editor.",
    );
  if (rows.some((row) => row.alternativa_f))
    throw new Error(
      "O arquivo contém alternativa F. Corrija para cinco alternativas (A a E) antes de abrir no editor.",
    );
  if (rows.some((row) => row.fase !== "1"))
    throw new Error(
      "O editor atual aceita apenas fase 1. Confira a fase no arquivo antes de abrir.",
    );
  const first = rows[0];
  if (rows.some((row) => row.codigo_avaliacao !== first.codigo_avaliacao))
    throw new Error(
      "Cada arquivo deve conter uma única avaliação. Separe os códigos em arquivos diferentes.",
    );
  const ids = new Set();
  return {
    code: first.codigo_avaliacao,
    title: first.titulo,
    type: first.tipo,
    version: first.versao,
    maxMinutes: first.tempo_maximo_minutos,
    isActive: /^(SIM|TRUE|1)$/i.test(first.avaliacao_ativa),
    notes: first.observacoes_avaliacao,
    questions: rows.map((row) => {
      let id = row.questao_id;
      if (!/^[a-z0-9][a-z0-9-]{2,127}$/.test(id) || ids.has(id)) id = createEditorQuestion().id;
      ids.add(id);
      return {
        id,
        examYear: row.ano_prova,
        originalNumber: row.numero_original,
        area: row.area,
        skillLabel: row.habilidade,
        difficulty: row.dificuldade,
        prompt: row.enunciado,
        supportText: row.texto_apoio,
        imageUrl: row.imagem_url,
        options: [
          row.alternativa_a,
          row.alternativa_b,
          row.alternativa_c,
          row.alternativa_d,
          row.alternativa_e,
        ],
        correctOption: /^[A-E]$/i.test(row.gabarito)
          ? String(row.gabarito.toUpperCase().charCodeAt(0) - 65)
          : "",
        explanation: row.explicacao,
        sourceUrl: row.fonte_url,
        notes: row.observacoes_questao,
      };
    }),
  };
}

// Use the same CSV parser as file imports, so both paths publish identical data.
export function buildEditorAssessment(draft) {
  const records = draft.questions.map((question, index) => ({
    codigo_avaliacao: draft.code,
    titulo: draft.title,
    tipo: draft.type,
    versao: draft.version,
    quantidade_questoes: String(draft.questions.length),
    tempo_maximo_minutos: draft.maxMinutes,
    avaliacao_ativa: draft.isActive ? "SIM" : "NAO",
    observacoes_avaliacao: draft.notes,
    questao_id: question.id,
    ordem: String(index + 1),
    ano_prova: question.examYear,
    fase: "1",
    numero_original: question.originalNumber,
    area: question.area,
    habilidade_id: editorCode(question.skillLabel),
    habilidade: question.skillLabel,
    dificuldade: question.difficulty,
    enunciado: question.prompt,
    texto_apoio: question.supportText,
    imagem_url: question.imageUrl,
    ...Object.fromEntries(
      ["a", "b", "c", "d", "e", "f"].map((letter, optionIndex) => [
        `alternativa_${letter}`,
        question.options[optionIndex] ?? "",
      ]),
    ),
    gabarito:
      question.correctOption === "" ? "" : String.fromCharCode(65 + Number(question.correctOption)),
    explicacao: question.explanation,
    fonte_url: question.sourceUrl,
    observacoes_questao: question.notes,
    questao_ativa: "SIM",
  }));
  const csv = serializeCsv(ASSESSMENT_CSV_HEADERS, records);
  const parsed = parseAssessmentCsvText(csv);
  if (new TextEncoder().encode(`\uFEFF${csv}`).length > 2 * 1024 * 1024) {
    parsed.errors.push({
      message:
        "A avaliação excede o limite de 2 MB do CSV. Reduza os textos antes de exportar ou publicar.",
    });
  }
  // Empty intermediate alternatives must never shift the answer index in the importer.
  draft.questions.forEach((question, index) => {
    question.options.forEach((option, optionIndex) => {
      if (
        !option.trim() ||
        option.length > 500 ||
        parsed.questions[index]?.options[optionIndex]?.length > 500
      ) {
        parsed.errors.push({
          row: index + 2,
          field: `alternativa_${String.fromCharCode(97 + optionIndex)}`,
          message: `Preencha a alternativa ${String.fromCharCode(65 + optionIndex)} com até 500 caracteres ou remova-a.`,
        });
      }
    });
    for (const [field, value, max] of [
      ["texto_apoio", question.supportText, 10000],
      ["imagem_url", question.imageUrl, MAX_ASSESSMENT_IMAGE_LENGTH],
      ["fonte_url", question.sourceUrl, 2048],
      ["observacoes_questao", question.notes, 2000],
    ]) {
      if (value.length > max)
        parsed.errors.push({
          row: index + 2,
          field,
          message: `O campo ${field} aceita até ${max} caracteres.`,
        });
    }
  });
  if (draft.notes.length > 2000)
    parsed.errors.push({
      field: "observacoes_avaliacao",
      message: "As observações da avaliação aceitam até 2000 caracteres.",
    });
  return { ...parsed, csv };
}
