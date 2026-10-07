import { ASSESSMENT_TYPES, ASSESSMENT_TYPE_LABELS, formatDuration } from "@/domain/assessment";

export const ASSESSMENT_CSV_HEADERS = [
  "codigo_avaliacao",
  "titulo",
  "tipo",
  "versao",
  "quantidade_questoes",
  "tempo_minimo_minutos",
  "tempo_maximo_minutos",
  "avaliacao_ativa",
  "observacoes_avaliacao",
  "questao_id",
  "ordem",
  "ano_prova",
  "fase",
  "numero_original",
  "area",
  "habilidade_id",
  "habilidade",
  "dificuldade",
  "enunciado",
  "texto_apoio",
  "imagem_url",
  "alternativa_a",
  "alternativa_b",
  "alternativa_c",
  "alternativa_d",
  "alternativa_e",
  "alternativa_f",
  "gabarito",
  "explicacao",
  "fonte_url",
  "observacoes_questao",
  "questao_ativa",
];

const ASSESSMENT_FIELDS = ASSESSMENT_CSV_HEADERS.slice(0, 9);

function asInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function asBoolean(value) {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (["SIM", "TRUE", "1"].includes(normalized)) return true;
  if (["NAO", "FALSE", "0"].includes(normalized)) return false;
  return null;
}

function issue(sheet, row, field, message) {
  return { sheet, row, field, message };
}

function validHttpsUrl(value) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function parseCsvText(source, delimiter = ";") {
  const text = String(source ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === delimiter) {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("O CSV contém aspas não finalizadas.");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim() !== ""));
}

function safeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
}

export function serializeCsv(headers, records) {
  const encode = (value) => `"${safeCsvValue(value).replaceAll('"', '""')}"`;
  return [headers, ...records.map((record) => headers.map((header) => record[header] ?? ""))]
    .map((row) => row.map(encode).join(";"))
    .join("\r\n");
}

function recordsFromCsv(text) {
  const rows = parseCsvText(text);
  if (!rows.length)
    return { records: [], errors: [issue("CSV", 1, null, "O arquivo está vazio.")] };
  const headers = rows[0].map((value) => value.trim());
  const missing = ASSESSMENT_CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length)
    return {
      records: [],
      errors: [issue("CSV", 1, null, `Colunas ausentes: ${missing.join(", ")}.`)],
    };
  const indexes = new Map(headers.map((header, index) => [header, index]));
  return {
    records: rows.slice(1).map((row, index) => ({
      ...Object.fromEntries(
        ASSESSMENT_CSV_HEADERS.map((header) => [
          header,
          String(row[indexes.get(header)] ?? "").trim(),
        ]),
      ),
      __row: index + 2,
    })),
    errors: [],
  };
}

export function validateAssessmentImport(assessmentRow, questionRows) {
  const errors = [];
  const warnings = [];
  const type = assessmentRow.tipo;
  const questionCount = asInteger(assessmentRow.quantidade_questoes);
  const minMinutes = asInteger(assessmentRow.tempo_minimo_minutos);
  const maxMinutes = asInteger(assessmentRow.tempo_maximo_minutos);
  const version = asInteger(assessmentRow.versao);
  const isActive = asBoolean(assessmentRow.ativa ?? assessmentRow.avaliacao_ativa);

  if (!/^[a-z0-9][a-z0-9-]{2,127}$/.test(assessmentRow.codigo_avaliacao))
    errors.push(
      issue(
        "CSV",
        assessmentRow.__row,
        "codigo_avaliacao",
        "Use letras minúsculas, números e hífens.",
      ),
    );
  if (!assessmentRow.titulo || assessmentRow.titulo.length > 160)
    errors.push(
      issue("CSV", assessmentRow.__row, "titulo", "Informe um título de até 160 caracteres."),
    );
  if (!ASSESSMENT_TYPES.includes(type))
    errors.push(issue("CSV", assessmentRow.__row, "tipo", "Tipo de avaliação inválido."));
  if (!version || version < 1 || version > 999)
    errors.push(
      issue("CSV", assessmentRow.__row, "versao", "A versão deve ser um inteiro entre 1 e 999."),
    );
  if (!questionCount || questionCount < 1 || questionCount > 100)
    errors.push(
      issue(
        "CSV",
        assessmentRow.__row,
        "quantidade_questoes",
        "Informe uma quantidade entre 1 e 100.",
      ),
    );
  if (["diagnostico_inicial", "diagnostico_final"].includes(type) && questionCount !== 25)
    errors.push(
      issue(
        "CSV",
        assessmentRow.__row,
        "quantidade_questoes",
        "O diagnóstico deve ter exatamente 25 questões.",
      ),
    );
  if (!minMinutes || !maxMinutes || minMinutes < 1 || maxMinutes < minMinutes || maxMinutes > 360)
    errors.push(
      issue(
        "CSV",
        assessmentRow.__row,
        "tempo_maximo_minutos",
        "Informe uma janela de tempo válida.",
      ),
    );
  if (
    ["diagnostico_inicial", "diagnostico_final"].includes(type) &&
    (minMinutes !== 30 || maxMinutes !== 90)
  )
    errors.push(
      issue(
        "CSV",
        assessmentRow.__row,
        "tempo_minimo_minutos",
        "O diagnóstico deve usar mínimo de 30 e máximo de 90 minutos.",
      ),
    );
  if (isActive === null)
    errors.push(issue("CSV", assessmentRow.__row, "avaliacao_ativa", "Use SIM ou NÃO."));

  const matchingRows = questionRows.filter(
    (row) => row.codigo_avaliacao === assessmentRow.codigo_avaliacao,
  );
  const activeRows = matchingRows.filter(
    (row) => asBoolean(row.ativa ?? row.questao_ativa) === true,
  );
  if (matchingRows.length !== questionCount)
    errors.push(
      issue(
        "CSV",
        null,
        "codigo_avaliacao",
        `Foram encontradas ${matchingRows.length} linhas; a avaliação declara ${questionCount}.`,
      ),
    );
  if (isActive && activeRows.length !== questionCount)
    errors.push(
      issue(
        "CSV",
        null,
        "questao_ativa",
        `Uma avaliação ativa precisa ter ${questionCount} questões marcadas como SIM.`,
      ),
    );

  const ids = new Set();
  const orders = new Set();
  const normalizedQuestions = matchingRows.map((row) => {
    const rowNumber = row.__row;
    const order = asInteger(row.ordem);
    const examYear = asInteger(row.ano_prova);
    const phase = asInteger(row.fase);
    const originalNumber = asInteger(row.numero_original);
    const difficulty = asInteger(row.dificuldade);
    const active = asBoolean(row.ativa ?? row.questao_ativa);
    const optionValues = [
      row.alternativa_a,
      row.alternativa_b,
      row.alternativa_c,
      row.alternativa_d,
      row.alternativa_e,
      row.alternativa_f,
    ];
    const options = optionValues.filter(Boolean);
    const answerLetter = row.gabarito.toUpperCase();
    const correctOption = answerLetter.charCodeAt(0) - 65;

    if (!/^[a-z0-9][a-z0-9-]{2,127}$/.test(row.questao_id))
      errors.push(
        issue("CSV", rowNumber, "questao_id", "Use letras minúsculas, números e hífens."),
      );
    else if (ids.has(row.questao_id))
      errors.push(issue("CSV", rowNumber, "questao_id", "Identificador duplicado."));
    ids.add(row.questao_id);
    if (!order || order < 1 || order > questionCount || orders.has(order))
      errors.push(
        issue(
          "CSV",
          rowNumber,
          "ordem",
          "A ordem deve ser única e estar dentro da quantidade da avaliação.",
        ),
      );
    orders.add(order);
    if (!examYear || examYear < 2009 || examYear > 2026)
      errors.push(issue("CSV", rowNumber, "ano_prova", "Informe um ano entre 2009 e 2026."));
    if (phase !== 1)
      errors.push(
        issue("CSV", rowNumber, "fase", "O conjunto atual usa somente a 1ª fase da OBB."),
      );
    if (!originalNumber || originalNumber < 1 || originalNumber > 200)
      errors.push(
        issue("CSV", rowNumber, "numero_original", "Informe o número original da questão."),
      );
    for (const [field, value, max] of [
      ["area", row.area, 120],
      ["habilidade_id", row.habilidade_id, 128],
      ["habilidade", row.habilidade, 120],
      ["enunciado", row.enunciado, 5000],
      ["explicacao", row.explicacao, 5000],
    ]) {
      if (!value || value.length > max)
        errors.push(
          issue("CSV", rowNumber, field, `Campo obrigatório com limite de ${max} caracteres.`),
        );
    }
    if (![1, 2, 3].includes(difficulty))
      errors.push(issue("CSV", rowNumber, "dificuldade", "Use 1, 2 ou 3."));
    if (options.length < 2 || options.length > 6)
      errors.push(
        issue("CSV", rowNumber, "alternativa_a", "Informe entre duas e seis alternativas."),
      );
    if (!/^[A-F]$/.test(answerLetter) || correctOption < 0 || !optionValues[correctOption])
      errors.push(
        issue(
          "CSV",
          rowNumber,
          "gabarito",
          "O gabarito deve apontar para uma alternativa preenchida.",
        ),
      );
    if (active === null) errors.push(issue("CSV", rowNumber, "questao_ativa", "Use SIM ou NÃO."));
    for (const [field, value] of [
      ["imagem_url", row.imagem_url],
      ["fonte_url", row.fonte_url],
    ]) {
      if (!validHttpsUrl(value))
        errors.push(issue("CSV", rowNumber, field, "Informe uma URL HTTPS válida ou deixe vazio."));
    }
    if (/SUBSTITUIR|PROVIS.RIA/i.test(`${row.area} ${row.enunciado}`)) {
      warnings.push(issue("CSV", rowNumber, "enunciado", "A questão ainda parece provisória."));
      if (isActive || active)
        errors.push(
          issue(
            "CSV",
            rowNumber,
            "enunciado",
            "Questões provisórias não podem ser publicadas como ativas.",
          ),
        );
    }
    return {
      id: row.questao_id,
      assessmentId: row.codigo_avaliacao,
      order,
      examYear,
      phase,
      originalNumber,
      area: row.area,
      skillId: row.habilidade_id,
      skillLabel: row.habilidade,
      difficulty,
      prompt: row.enunciado,
      supportText: row.texto_apoio,
      imageUrl: row.imagem_url,
      options,
      correctOption,
      explanation: row.explicacao,
      sourceUrl: row.fonte_url,
      notes: row.observacoes ?? row.observacoes_questao,
      isActive: active,
    };
  });

  return {
    assessment: {
      id: assessmentRow.codigo_avaliacao,
      title: assessmentRow.titulo,
      type,
      version,
      questionCount,
      minMinutes,
      maxMinutes,
      isActive,
      notes: assessmentRow.observacoes ?? assessmentRow.observacoes_avaliacao,
    },
    questions: normalizedQuestions.sort((a, b) => a.order - b.order),
    errors,
    warnings,
  };
}

export function parseAssessmentCsvText(text) {
  const parsed = recordsFromCsv(text);
  if (parsed.errors.length)
    return { assessment: null, questions: [], errors: parsed.errors, warnings: [] };
  if (!parsed.records.length)
    return {
      assessment: null,
      questions: [],
      errors: [issue("CSV", 2, null, "Inclua pelo menos uma questão.")],
      warnings: [],
    };
  const first = parsed.records[0];
  const consistencyErrors = [];
  for (const row of parsed.records.slice(1)) {
    for (const field of ASSESSMENT_FIELDS) {
      if (row[field] !== first[field])
        consistencyErrors.push(
          issue(
            "CSV",
            row.__row,
            field,
            "Os dados da avaliação devem ser iguais em todas as linhas.",
          ),
        );
    }
  }
  const assessmentRow = {
    ...first,
    ativa: first.avaliacao_ativa,
    observacoes: first.observacoes_avaliacao,
  };
  const questionRows = parsed.records.map((row) => ({
    ...row,
    ativa: row.questao_ativa,
    observacoes: row.observacoes_questao,
  }));
  const result = validateAssessmentImport(assessmentRow, questionRows);
  return { ...result, errors: [...consistencyErrors, ...result.errors] };
}

export async function parseAssessmentCsv(file) {
  if (!file?.name?.toLowerCase().endsWith(".csv"))
    throw new Error("Selecione um arquivo no formato .csv.");
  if (file.size > 2 * 1024 * 1024) throw new Error("O CSV deve ter no máximo 2 MB.");
  return parseAssessmentCsvText(await file.text());
}

function safeDate(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-BR");
}

function studentReportRecords(session) {
  const common = {
    aluno: session.studentName,
    email: session.studentEmail,
    turma: session.className,
    avaliacao: session.assessmentTitle,
    tipo: ASSESSMENT_TYPE_LABELS[session.assessmentType] ?? session.assessmentType,
    situacao: session.status === "completed" ? "Concluído" : "Em andamento",
    inicio: safeDate(session.startedAt),
    conclusao: safeDate(session.completedAt),
    duracao: session.report ? formatDuration(session.report.durationSeconds) : "",
    acertos: session.report?.correctCount ?? "",
    erros: session.report?.incorrectCount ?? "",
    em_branco: session.report?.blankCount ?? "",
    percentual: session.report ? `${session.report.percentage}%` : "",
  };
  const results = session.report?.questionResults ?? [];
  if (!results.length) return [{ ...common }];
  return results.map((item) => ({
    ...common,
    ordem: item.order,
    area: item.area,
    habilidade: item.skillLabel,
    enunciado: item.prompt,
    resposta_aluno: item.selectedAnswer || "Em branco",
    gabarito: item.correctAnswer,
    resultado: item.correct ? "Correta" : item.selectedOption === null ? "Em branco" : "Incorreta",
    explicacao: item.explanation,
    ano_prova: item.examYear,
    numero_original: item.originalNumber,
  }));
}

const REPORT_HEADERS = [
  "aluno",
  "email",
  "turma",
  "avaliacao",
  "tipo",
  "situacao",
  "inicio",
  "conclusao",
  "duracao",
  "acertos",
  "erros",
  "em_branco",
  "percentual",
  "ordem",
  "area",
  "habilidade",
  "enunciado",
  "resposta_aluno",
  "gabarito",
  "resultado",
  "explicacao",
  "ano_prova",
  "numero_original",
];

export function buildStudentReportCsv(session) {
  return serializeCsv(REPORT_HEADERS, studentReportRecords(session));
}

export function buildTeacherReportCsv(sessions) {
  return serializeCsv(REPORT_HEADERS, sessions.flatMap(studentReportRecords));
}

export function downloadCsv(csv, filename) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const assessmentSpreadsheet = {
  parse: parseAssessmentCsv,
  templateUrl: "/templates/modelo-avaliacoes-olympic-school.csv",
  exportStudent(session) {
    downloadCsv(buildStudentReportCsv(session), `relatorio-${session.assessmentType}.csv`);
  },
  exportTeacher(sessions) {
    downloadCsv(buildTeacherReportCsv(sessions), "resultados-diagnostico.csv");
  },
};
