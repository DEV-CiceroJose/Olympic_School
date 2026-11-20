import { createFileRoute } from "@tanstack/react-router";
import { AssessmentPage } from "@/components/assessment/assessment-page";

export const Route = createFileRoute("/app/diagnostic")({ component: AssessmentPage });
