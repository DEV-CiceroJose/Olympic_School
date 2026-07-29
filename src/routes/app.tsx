import { createFileRoute } from "@tanstack/react-router";
import { LearningShell } from "@/components/learning/learning-shell";

export const Route = createFileRoute("/app")({
  component: LearningShell,
});
