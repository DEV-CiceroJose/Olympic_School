import type { StudyArtifact } from "@/domain/artifacts";

const KEY = "biodoraia.artifacts";

function read(): StudyArtifact[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as StudyArtifact[];
  } catch {
    return [];
  }
}

export const artifactRepository = {
  list: read,
  save(artifact: StudyArtifact) {
    if (typeof window === "undefined") return;
    const artifacts = read().filter((item) => item.id !== artifact.id);
    window.localStorage.setItem(KEY, JSON.stringify([artifact, ...artifacts]));
  },
  has(id: string) {
    return read().some((artifact) => artifact.id === id);
  },
};
