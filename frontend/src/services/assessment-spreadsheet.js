import { ASSESSMENT_TYPES, ASSESSMENT_TYPE_LABELS, formatDuration } from "@/domain/assessment";

const ASSESSMENT_HEADERS = [
  "codigo_avaliacao",
  "titulo",
  "tipo",
  "versao",
  "quantidade_questoes",
  "tempo_minimo_minutos",
  "tempo_maximo_minutos",
  "ativa",
  "observacoes",
];

const QUESTION_HEADERS = [
  "codigo_avaliacao",
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
  "observacoes",
  "ativa",
];

const HEADER_FILL = "173F35";
const HEADER_FONT = "FFFFFF";
const ACCENT_FILL = "DDF5E7";
const BORDER = "B8C7C1";

async function excelModule() {
  const module = await import("exceljs");
  return module.default ?? module;
}

function cellText(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value) return String(value.text ?? "").trim();
    if ("result" in value) return String(value.result ?? "").trim();
    if (Array.isArray(value.richText)) {
      return value.richText
        .map((item) => item.text ?? "")
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

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

function findHeaderRow(worksheet, requiredHeader) {
  const limit = Math.min(worksheet.rowCount, 30);
  for (let rowNumber = 1; rowNumber <= limit; rowNumber += 1) {
    if (cellText(worksheet.getRow(rowNumber).getCell(1)) === requiredHeader) return rowNumber;
  }
  return null;
}

function sheetRecords(worksheet, headers, requiredHeader) {
  const headerRowNumber = findHeaderRow(worksheet, requiredHeader);
  if (!headerRowNumber) {
    return { records: [], errors: [`Cabeçalho '${requiredHeader}' não encontrado.`] };
  }
  const headerRow = worksheet.getRow(headerRowNumber);
  const actualHeaders = headers.map((_, index) => cellText(headerRow.getCell(index + 1)));
  const missing = headers.filter((header) => !actualHeaders.includes(header));
  if (missing.length) {
    return { records: [], errors: [`Colunas ausentes: ${missing.join(", ")}.`] };
  }
  const indexes = new Map(actualHeaders.map((header, index) => [header, index + 1]));
  const records = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const record = Object.fromEntries(
      headers.map((header) => [header, cellText(row.getCell(indexes.get(header)))]),
    );
    if (!Object.values(record).some(Boolean)) continue;
    records.push({ ...record, __row: rowNumber });
  }
  return { records, errors: [] };
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

export function validateAssessmentImport(assessmentRow, questionRows) {
  const errors = [];
  const warnings = [];
  const type = assessmentRow.tipo;
  const questionCount = asInteger(assessmentRow.quantidade_questoes);
  const minMinutes = asInteger(assessmentRow.tempo_minimo_minutos);
  const maxMinutes = asInteger(assessmentRow.tempo_maximo_minutos);
  const version = asInteger(assessmentRow.versao);
  const isActive = asBoolean(assessmentRow.ativa);

  if (!/^[a-z0-9][a-z0-9-]{2,127}$/.test(assessmentRow.codigo_avaliacao)) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "codigo_avaliacao",
        "Use letras minúsculas, números e hífens.",
      ),
    );
  }
  if (!assessmentRow.titulo || assessmentRow.titulo.length > 160) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "titulo",
        "Informe um título de até 160 caracteres.",
      ),
    );
  }
  if (!ASSESSMENT_TYPES.includes(type)) {
    errors.push(issue("Avaliações", assessmentRow.__row, "tipo", "Tipo de avaliação inválido."));
  }
  if (!version || version < 1 || version > 999) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "versao",
        "A versão deve ser um inteiro entre 1 e 999.",
      ),
    );
  }
  if (!questionCount || questionCount < 1 || questionCount > 100) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "quantidade_questoes",
        "Informe uma quantidade entre 1 e 100.",
      ),
    );
  }
  if (["diagnostico_inicial", "diagnostico_final"].includes(type) && questionCount !== 25) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "quantidade_questoes",
        "O diagnóstico deve ter exatamente 25 questões.",
      ),
    );
  }
  if (!minMinutes || !maxMinutes || minMinutes < 1 || maxMinutes < minMinutes || maxMinutes > 360) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "tempo_maximo_minutos",
        "Informe uma janela de tempo válida.",
      ),
    );
  }
  if (
    ["diagnostico_inicial", "diagnostico_final"].includes(type) &&
    (minMinutes !== 30 || maxMinutes !== 90)
  ) {
    errors.push(
      issue(
        "Avaliações",
        assessmentRow.__row,
        "tempo_minimo_minutos",
        "O diagnóstico deve usar mínimo de 30 e máximo de 90 minutos.",
      ),
    );
  }
  if (isActive === null) {
    errors.push(issue("Avaliações", assessmentRow.__row, "ativa", "Use SIM ou NÃO."));
  }

  const matchingRows = questionRows.filter(
    (row) => row.codigo_avaliacao === assessmentRow.codigo_avaliacao,
  );
  const activeRows = matchingRows.filter((row) => asBoolean(row.ativa) === true);
  if (matchingRows.length !== questionCount) {
    errors.push(
      issue(
        "Questões",
        null,
        "codigo_avaliacao",
        `Foram encontradas ${matchingRows.length} linhas; a avaliação declara ${questionCount}.`,
      ),
    );
  }
  if (isActive && activeRows.length !== questionCount) {
    errors.push(
      issue(
        "Questões",
        null,
        "ativa",
        `Uma avaliação ativa precisa ter ${questionCount} questões marcadas como SIM.`,
      ),
    );
  }

  const ids = new Set();
  const orders = new Set();
  const normalizedQuestions = matchingRows.map((row) => {
    const rowNumber = row.__row;
    const order = asInteger(row.ordem);
    const examYear = asInteger(row.ano_prova);
    const phase = asInteger(row.fase);
    const originalNumber = asInteger(row.numero_original);
    const difficulty = asInteger(row.dificuldade);
    const active = asBoolean(row.ativa);
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

    if (!/^[a-z0-9][a-z0-9-]{2,127}$/.test(row.questao_id)) {
      errors.push(
        issue("Questões", rowNumber, "questao_id", "Use letras minúsculas, números e hífens."),
      );
    } else if (ids.has(row.questao_id)) {
      errors.push(issue("Questões", rowNumber, "questao_id", "Identificador duplicado."));
    }
    ids.add(row.questao_id);
    if (!order || order < 1 || order > questionCount || orders.has(order)) {
      errors.push(
        issue(
          "Questões",
          rowNumber,
          "ordem",
          "A ordem deve ser única e estar dentro da quantidade da avaliação.",
        ),
      );
    }
    orders.add(order);
    if (!examYear || examYear < 2009 || examYear > 2026) {
      errors.push(issue("Questões", rowNumber, "ano_prova", "Informe um ano entre 2009 e 2026."));
    }
    if (phase !== 1) {
      errors.push(
        issue("Questões", rowNumber, "fase", "O conjunto atual usa somente a 1ª fase da OBB."),
      );
    }
    if (!originalNumber || originalNumber < 1 || originalNumber > 200) {
      errors.push(
        issue("Questões", rowNumber, "numero_original", "Informe o número original da questão."),
      );
    }
    for (const [field, value, max] of [
      ["area", row.area, 120],
      ["habilidade_id", row.habilidade_id, 128],
      ["habilidade", row.habilidade, 120],
      ["enunciado", row.enunciado, 5000],
      ["explicacao", row.explicacao, 5000],
    ]) {
      if (!value || value.length > max) {
        errors.push(
          issue("Questões", rowNumber, field, `Campo obrigatório com limite de ${max} caracteres.`),
        );
      }
    }
    if (![1, 2, 3].includes(difficulty)) {
      errors.push(issue("Questões", rowNumber, "dificuldade", "Use 1, 2 ou 3."));
    }
    if (options.length < 2 || options.length > 6) {
      errors.push(
        issue("Questões", rowNumber, "alternativa_a", "Informe entre duas e seis alternativas."),
      );
    }
    if (!/^[A-F]$/.test(answerLetter) || correctOption < 0 || !optionValues[correctOption]) {
      errors.push(
        issue(
          "Questões",
          rowNumber,
          "gabarito",
          "O gabarito deve apontar para uma alternativa preenchida.",
        ),
      );
    }
    if (active === null) {
      errors.push(issue("Questões", rowNumber, "ativa", "Use SIM ou NÃO."));
    }
    for (const [field, value] of [
      ["imagem_url", row.imagem_url],
      ["fonte_url", row.fonte_url],
    ]) {
      if (!validHttpsUrl(value)) {
        errors.push(
          issue("Questões", rowNumber, field, "Informe uma URL HTTPS válida ou deixe vazio."),
        );
      }
    }
    if (/SUBSTITUIR|PROVIS.RIA/i.test(`${row.area} ${row.enunciado}`)) {
      warnings.push(
        issue("Questões", rowNumber, "enunciado", "A questão ainda parece provisória."),
      );
      if (isActive || active) {
        errors.push(
          issue(
            "Questões",
            rowNumber,
            "enunciado",
            "Questões provisórias não podem ser publicadas como ativas.",
          ),
        );
      }
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
      notes: row.observacoes,
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
      notes: assessmentRow.observacoes,
    },
    questions: normalizedQuestions.sort((a, b) => a.order - b.order),
    errors,
    warnings,
  };
}

export async function parseAssessmentWorkbook(file) {
  if (!file?.name?.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Selecione um arquivo no formato .xlsx.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("A planilha deve ter no máximo 10 MB.");
  }
  const ExcelJS = await excelModule();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const assessments = workbook.getWorksheet("Avaliações");
  const questions = workbook.getWorksheet("Questões");
  if (!assessments || !questions) {
    throw new Error("A planilha deve conter as abas Avaliações e Questões.");
  }
  const assessmentData = sheetRecords(assessments, ASSESSMENT_HEADERS, "codigo_avaliacao");
  const questionData = sheetRecords(questions, QUESTION_HEADERS, "codigo_avaliacao");
  const structuralErrors = [
    ...assessmentData.errors.map((message) => issue("Avaliações", null, null, message)),
    ...questionData.errors.map((message) => issue("Questões", null, null, message)),
  ];
  if (assessmentData.records.length !== 1) {
    structuralErrors.push(
      issue("Avaliações", null, null, "Envie exatamente uma avaliação por arquivo."),
    );
  }
  if (structuralErrors.length) {
    return { assessment: null, questions: [], errors: structuralErrors, warnings: [] };
  }
  return validateAssessmentImport(assessmentData.records[0], questionData.records);
}

function styleHeader(row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: HEADER_FONT } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
  });
}

function styleWorkbookSheet(sheet) {
  sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.font = { ...cell.font, name: "Arial", size: cell.font?.size ?? 10 };
      cell.alignment = { ...cell.alignment, vertical: "middle" };
    });
  });
  styleHeader(sheet.getRow(1));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

function safeDate(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date;
}

function percentage(value) {
  return Number(value ?? 0) / 100;
}

export async function buildStudentReportWorkbook(session) {
  const ExcelJS = await excelModule();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Olympic School";
  const summary = workbook.addWorksheet("Resumo");
  summary.addRow(["Campo", "Resultado"]);
  summary.addRows([
    ["Aluno", session.studentName],
    ["Turma", session.className],
    ["Avaliação", session.assessmentTitle],
    ["Tipo", ASSESSMENT_TYPE_LABELS[session.assessmentType] ?? session.assessmentType],
    ["Início", safeDate(session.startedAt)],
    ["Conclusão", safeDate(session.completedAt)],
    ["Duração", formatDuration(session.report?.durationSeconds)],
    ["Acertos", session.report?.correctCount ?? 0],
    ["Erros", session.report?.incorrectCount ?? 0],
    ["Em branco", session.report?.blankCount ?? 0],
    ["Percentual", percentage(session.report?.percentage)],
  ]);
  summary.getColumn(1).width = 24;
  summary.getColumn(2).width = 48;
  summary.getCell("B6").numFmt = "dd/mm/yyyy hh:mm";
  summary.getCell("B7").numFmt = "dd/mm/yyyy hh:mm";
  summary.getCell("B12").numFmt = "0%";
  styleWorkbookSheet(summary);

  const performance = workbook.addWorksheet("Desempenho");
  performance.addRow(["Dimensão", "Área ou habilidade", "Acertos", "Total", "Percentual"]);
  for (const item of session.report?.areaResults ?? []) {
    performance.addRow(["Área", item.area, item.correct, item.total, percentage(item.percentage)]);
  }
  for (const item of session.report?.skillResults ?? []) {
    performance.addRow([
      "Habilidade",
      item.label,
      item.correct,
      item.total,
      percentage(item.percentage),
    ]);
  }
  performance.columns = [18, 38, 12, 12, 16].map((width) => ({ width }));
  performance.getColumn(5).numFmt = "0%";
  styleWorkbookSheet(performance);

  const answers = workbook.addWorksheet("Respostas");
  answers.addRow([
    "Ordem",
    "Área",
    "Habilidade",
    "Enunciado",
    "Resposta do aluno",
    "Gabarito",
    "Resultado",
    "Explicação",
    "Ano",
    "Questão original",
  ]);
  for (const item of session.report?.questionResults ?? []) {
    answers.addRow([
      item.order,
      item.area,
      item.skillLabel,
      item.prompt,
      item.selectedAnswer || "Em branco",
      item.correctAnswer,
      item.correct ? "Correta" : item.selectedOption === null ? "Em branco" : "Incorreta",
      item.explanation,
      item.examYear,
      item.originalNumber,
    ]);
  }
  answers.columns = [10, 22, 28, 70, 38, 38, 14, 70, 10, 18].map((width) => ({ width }));
  answers.getColumn(4).alignment = { wrapText: true, vertical: "top" };
  answers.getColumn(8).alignment = { wrapText: true, vertical: "top" };
  styleWorkbookSheet(answers);
  return workbook;
}

export async function buildTeacherReportWorkbook(sessions) {
  const ExcelJS = await excelModule();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Olympic School";
  const students = workbook.addWorksheet("Alunos");
  students.addRow([
    "Aluno",
    "E-mail",
    "Turma",
    "Avaliação",
    "Situação",
    "Início",
    "Conclusão",
    "Duração",
    "Acertos",
    "Erros",
    "Em branco",
    "Percentual",
  ]);
  for (const session of sessions) {
    students.addRow([
      session.studentName,
      session.studentEmail,
      session.className,
      session.assessmentTitle,
      session.status === "completed" ? "Concluído" : "Em andamento",
      safeDate(session.startedAt),
      safeDate(session.completedAt),
      session.report ? formatDuration(session.report.durationSeconds) : "",
      session.report?.correctCount ?? "",
      session.report?.incorrectCount ?? "",
      session.report?.blankCount ?? "",
      session.report ? percentage(session.report.percentage) : "",
    ]);
  }
  students.columns = [28, 34, 16, 32, 16, 20, 20, 16, 12, 12, 12, 16].map((width) => ({ width }));
  students.getColumn(6).numFmt = "dd/mm/yyyy hh:mm";
  students.getColumn(7).numFmt = "dd/mm/yyyy hh:mm";
  students.getColumn(12).numFmt = "0%";
  styleWorkbookSheet(students);

  const performance = workbook.addWorksheet("Desempenho");
  performance.addRow([
    "Aluno",
    "Turma",
    "Dimensão",
    "Área ou habilidade",
    "Acertos",
    "Total",
    "Percentual",
  ]);
  for (const session of sessions) {
    for (const item of session.report?.areaResults ?? []) {
      performance.addRow([
        session.studentName,
        session.className,
        "Área",
        item.area,
        item.correct,
        item.total,
        percentage(item.percentage),
      ]);
    }
    for (const item of session.report?.skillResults ?? []) {
      performance.addRow([
        session.studentName,
        session.className,
        "Habilidade",
        item.label,
        item.correct,
        item.total,
        percentage(item.percentage),
      ]);
    }
  }
  performance.columns = [28, 16, 16, 38, 12, 12, 16].map((width) => ({ width }));
  performance.getColumn(7).numFmt = "0%";
  styleWorkbookSheet(performance);

  const answers = workbook.addWorksheet("Respostas");
  answers.addRow([
    "Aluno",
    "Turma",
    "Ordem",
    "Área",
    "Habilidade",
    "Enunciado",
    "Resposta",
    "Gabarito",
    "Resultado",
    "Ano",
    "Questão original",
  ]);
  for (const session of sessions) {
    for (const item of session.report?.questionResults ?? []) {
      answers.addRow([
        session.studentName,
        session.className,
        item.order,
        item.area,
        item.skillLabel,
        item.prompt,
        item.selectedAnswer || "Em branco",
        item.correctAnswer,
        item.correct ? "Correta" : item.selectedOption === null ? "Em branco" : "Incorreta",
        item.examYear,
        item.originalNumber,
      ]);
    }
  }
  answers.columns = [28, 16, 10, 22, 28, 70, 38, 38, 14, 10, 18].map((width) => ({ width }));
  answers.getColumn(6).alignment = { wrapText: true, vertical: "top" };
  styleWorkbookSheet(answers);
  return workbook;
}

export async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const assessmentSpreadsheet = {
  parse: parseAssessmentWorkbook,
  templateUrl: "/templates/modelo-avaliacoes-olympic-school.xlsx",
  async exportStudent(session) {
    const workbook = await buildStudentReportWorkbook(session);
    await downloadWorkbook(workbook, `relatorio-${session.assessmentType}.xlsx`);
  },
  async exportTeacher(sessions) {
    const workbook = await buildTeacherReportWorkbook(sessions);
    await downloadWorkbook(workbook, "resultados-diagnostico.xlsx");
  },
};
