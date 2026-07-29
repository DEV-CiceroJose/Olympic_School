const defaultTopics = [
  "Estrutura celular",
  "Genética",
  "Ecologia",
  "Fisiologia humana",
  "Evolução",
];
export function generateStudyPlan(id, createdAt, input, mastery) {
  const weakTopics = [...mastery]
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((item) => item.label);
  const topics = [...(input.priorityTopics ?? []), ...weakTopics, ...defaultTopics].filter(
    (topic, index, list) => topic.trim() && list.indexOf(topic) === index,
  );
  const days = input.availableDays.length ? input.availableDays : ["Sábado"];
  const sessions = Array.from({ length: Math.max(6, days.length * 3) }, (_, index) => {
    const isLast = index === Math.max(6, days.length * 3) - 1;
    const activity = isLast
      ? "simulation"
      : index % 3 === 2
        ? "review"
        : index % 2 === 0
          ? "concept"
          : "questions";
    return {
      id: `${id}-session-${index + 1}`,
      day: days[index % days.length],
      week: Math.floor(index / days.length) + 1,
      topic: topics[index % topics.length],
      minutes: input.minutesPerDay,
      activity,
      completed: false,
    };
  });
  return {
    id,
    input,
    objective: `Preparação para ${input.targetOlympiad}, priorizando as lacunas registradas.`,
    createdAt,
    sessions,
  };
}
