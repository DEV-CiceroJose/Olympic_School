import { createFileRoute } from "@tanstack/react-router";
import { LearningShell } from "@/components/learning/learning-shell";
import { RequireAuth } from "@/components/auth/require-auth";

export const Route = createFileRoute("/app")({
  component: () => (
    <RequireAuth>
      <LearningShell />
    </RequireAuth>
  ),
});
