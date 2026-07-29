export const artifactLabels = {
  summary: "Resumo",
  questions: "Questões",
  flashcards: "Flashcards",
  mindmap: "Mapa mental",
  "study-plan": "Plano de estudo",
};
export function isArtifactMode(mode) {
  return (
    mode === "summary" ||
    mode === "questions" ||
    mode === "flashcards" ||
    mode === "mindmap" ||
    mode === "study-plan"
  );
}
