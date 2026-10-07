import assert from "node:assert/strict";
import test from "node:test";
import { computeAssessmentReport } from "./assessment-logic.js";

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
