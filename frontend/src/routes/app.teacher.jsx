import { createFileRoute } from "@tanstack/react-router";
import { RequireTeacher } from "@/components/auth/require-teacher";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";

export const Route = createFileRoute("/app/teacher")({
  component: () => (
    <RequireTeacher>
      <TeacherDashboard />
    </RequireTeacher>
  ),
});
