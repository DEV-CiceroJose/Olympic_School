import type { AssistantMode } from "@/types/chat";

export type ArtifactKind = Exclude<AssistantMode, "tutor" | "review">;

export type StudyArtifact = {
  id: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  createdAt: string;
  sourceConversationId?: string;
};

export const artifactLabels: Record<ArtifactKind, string> = {
  summary: "Resumo",
  questions: "Questões",
  flashcards: "Flashcards",
  mindmap: "Mapa mental",
  "study-plan": "Plano de estudo",
};

export function isArtifactMode(mode?: AssistantMode): mode is ArtifactKind {
  return Boolean(mode && mode !== "tutor" && mode !== "review");
}
