export const artifactLabels = Object.freeze({
  summary: "Resumo",
  questions: "Questões",
  flashcards: "Flashcards",
  mindmap: "Mapa mental",
  "study-plan": "Plano de estudo",
});

export function isArtifactMode(mode) {
  return Object.hasOwn(artifactLabels, mode);
}

export const artifactDomain = Object.freeze({ artifactLabels, isArtifactMode });
