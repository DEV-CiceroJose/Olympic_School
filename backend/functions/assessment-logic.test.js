import assert from "node:assert/strict";
import test from "node:test";
import {
  assessmentSessionId,
  computeAssessmentReport,
  validAssessmentStart,
} from "./assessment-logic.js";
import {
  finalizeAssessment,
  submitAssessmentAnswer,
} from "../assessment-worker/assessments.js";

test("computes correct, wrong and blank answers without exposing feedback early", () => {
  const time = (value) => ({ toMillis: () => value });
  const questions = [
    {
      id: "q1",
      order: 1,
      area: "Citologia",
      skillId: "h1",
      skillLabel: "Células",
      prompt: "P1",
      options: ["A", "B"],
      examYear: 2020,
      originalNumber: 1,
    },
    {
      id: "q2",
      order: 2,
      area: "Ecologia",
      skillId: "h2",
      skillLabel: "Ecossistemas",
      prompt: "P2",
      options: ["A", "B"],
      examYear: 2021,
      originalNumber: 2,
    },
    {
      id: "q3",
      order: 3,
      area: "Ecologia",
      skillId: "h2",
      skillLabel: "Ecossistemas",
      prompt: "P3",
      options: ["A", "B"],
      examYear: 2022,
      originalNumber: 3,
    },
  ];
  const report = computeAssessmentReport({
    session: { startedAt: time(0), deadlineAt: time(5_400_000) },
    questions,
    answerKeys: [
      { id: "q1", correctOption: 0, explanation: "E1" },
      { id: "q2", correctOption: 1, explanation: "E2" },
      { id: "q3", correctOption: 1, explanation: "E3" },
    ],
    responses: [
      { questionId: "q1", selectedOption: 0 },
      { questionId: "q2", selectedOption: 0 },
    ],
    completedAt: time(1_800_000),
  });
  assert.equal(report.correctCount, 1);
  assert.equal(report.incorrectCount, 1);
  assert.equal(report.blankCount, 1);
  assert.equal(report.percentage, 33);
  assert.equal(report.durationSeconds, 1800);
});

test("caps duration at the 90-minute deadline", () => {
  const time = (value) => ({ toMillis: () => value });
  const question = {
    id: "q1",
    order: 1,
    area: "A",
    skillId: "h1",
    skillLabel: "H",
    prompt: "P",
    options: ["A", "B"],
    examYear: 2020,
    originalNumber: 1,
  };
  const report = computeAssessmentReport({
    session: { startedAt: time(0), deadlineAt: time(5_400_000) },
    questions: [question],
    answerKeys: [{ id: "q1", correctOption: 0, explanation: "E" }],
    responses: [],
    completedAt: time(5_700_000),
  });
  assert.equal(report.durationSeconds, 5400);
});

test("keeps diagnostic attempt IDs and separates mock attempts by publication", () => {
  assert.equal(
    assessmentSessionId("student", "diagnostico_inicial", "first"),
    "student_diagnostico_inicial",
  );
  assert.equal(
    assessmentSessionId("student", "diagnostico_inicial", "second"),
    "student_diagnostico_inicial",
  );
  assert.equal(assessmentSessionId("student", "simulado", "first"), "student_simulado_first");
  assert.equal(assessmentSessionId("student", "simulado", "second"), "student_simulado_second");
  assert.equal(validAssessmentStart("first", "simulado"), true);
  assert.equal(validAssessmentStart("a/b", "simulado"), false);
});

test("finalizes a legacy mock exam before its previous minimum submission time", async () => {
  const start = new Date(0);
  const completedAt = new Date(10_000);
  const sessionId = "student_simulado_mock";
  const sessionPath = `assessmentSessions/${sessionId}`;
  const questionId = "question-one";
  const session = {
    userId: "student",
    assessmentId: "mock",
    assessmentType: "simulado",
    questionIds: [questionId],
    answeredCount: 0,
    startedAt: start,
    earliestSubmitAt: new Date(60_000),
    deadlineAt: new Date(90 * 60_000),
    status: "in_progress",
  };
  const documents = new Map([
    [sessionPath, session],
    [
      `assessmentDefinitions/mock/questions/${questionId}`,
      {
        order: 1,
        area: "Citologia",
        skillId: "celulas",
        skillLabel: "Identificar células",
        prompt: "Qual alternativa identifica a célula?",
        options: ["A", "B"],
      },
    ],
    [
      `assessmentDefinitions/mock/answerKeys/${questionId}`,
      { correctOption: 0, explanation: "A é a resposta correta." },
    ],
  ]);
  const snapshot = (path) => ({ id: path.split("/").at(-1), data: documents.get(path) });
  const store = {
    get: async (path) => (documents.has(path) ? snapshot(path) : null),
    getMany: async (paths) => paths.filter((path) => documents.has(path)).map(snapshot),
    commit: async (writes) => {
      for (const { path, fields } of writes) {
        const document = documents.get(path) ?? {};
        documents.set(path, Object.assign(document, fields));
      }
    },
  };
  const identity = { sub: "student" };
  await submitAssessmentAnswer(
    store,
    identity,
    { sessionId, questionId, selectedOption: 0 },
    () => new Date(5_000),
  );
  const result = await finalizeAssessment(store, identity, { sessionId }, () => completedAt);
  assert.deepEqual(result, { completed: true });
  assert.equal(session.status, "completed");
  assert.equal(session.report.percentage, 100);
  assert.equal(session.report.durationSeconds, 10);
});
