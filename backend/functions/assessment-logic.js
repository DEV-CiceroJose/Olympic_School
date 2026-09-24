export function computeAssessmentReport({
  session,
  questions,
  answerKeys,
  responses,
  completedAt,
}) {
  const responseMap = new Map(responses.map((item) => [item.questionId, item]));
  const keyMap = new Map(answerKeys.map((item) => [item.id, item]));
  const groups = (field, labelField = field) =>
    new Map(
      questions.map((item) => [item[field], { label: item[labelField], correct: 0, total: 0 }]),
    );
  const areas = groups("area");
  const skills = groups("skillId", "skillLabel");
  const questionResults = questions.map((question) => {
    const response = responseMap.get(question.id);
    const key = keyMap.get(question.id);
    const correct = Boolean(response && response.selectedOption === key.correctOption);
    for (const group of [areas.get(question.area), skills.get(question.skillId)]) {
      group.total += 1;
      if (correct) group.correct += 1;
    }
    return {
      order: question.order,
      questionId: question.id,
      area: question.area,
      skillId: question.skillId,
      skillLabel: question.skillLabel,
      prompt: question.prompt,
      examYear: question.examYear,
      originalNumber: question.originalNumber,
      selectedOption: response?.selectedOption ?? null,
      selectedAnswer: response ? question.options[response.selectedOption] : "",
      correctOption: key.correctOption,
      correctAnswer: question.options[key.correctOption],
      explanation: key.explanation,
      correct,
    };
  });
  const correctCount = questionResults.filter((item) => item.correct).length;
  const blankCount = questionResults.filter((item) => item.selectedOption === null).length;
  const summarize = ([id, item], key) => ({
    [key]: id,
    ...(key === "skillId" ? { label: item.label } : {}),
    correct: item.correct,
    total: item.total,
    percentage: Math.round((item.correct / item.total) * 100),
  });
  const startedAt = session.startedAt.toMillis();
  const completedMillis = session.deadlineAt
    ? Math.min(completedAt.toMillis(), session.deadlineAt.toMillis())
    : completedAt.toMillis();
  return {
    correctCount,
    incorrectCount: questions.length - correctCount - blankCount,
    blankCount,
    percentage: Math.round((correctCount / questions.length) * 100),
    durationSeconds: Math.max(0, Math.round((completedMillis - startedAt) / 1000)),
    areaResults: [...areas].map((item) => summarize(item, "area")),
    skillResults: [...skills].map((item) => summarize(item, "skillId")),
    questionResults,
  };
}
