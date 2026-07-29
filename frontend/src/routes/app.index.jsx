import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BrainCircuit, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export const Route = createFileRoute("/app/")({
  component: LearningHome,
});
const actions = [
  {
    to: "/app/diagnostic",
    title: "Descubra suas lacunas",
    description: "Responda 15 questões e receba um mapa por habilidade.",
    icon: ClipboardCheck,
  },
  {
    to: "/app/training",
    title: "Treine com prioridade",
    description: "A próxima questão considera seu domínio registrado.",
    icon: BrainCircuit,
  },
  {
    to: "/app/progress",
    title: "Acompanhe a evolução",
    description: "Veja forças, lacunas e confiança das medições.",
    icon: BarChart3,
  },
];
function LearningHome() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        Sua trilha adaptativa
      </span>
      <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold tracking-tight">
        Não estude tudo. Estude o que você precisa melhorar.
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Comece pelo diagnóstico. Cada resposta alimenta um cálculo determinístico e orienta a
        próxima atividade.
      </p>
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {actions.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="h-full bg-card/70 transition hover:-translate-y-1 hover:border-primary/40">
              <CardHeader>
                <Icon className="size-6 text-primary" />
                <CardTitle className="pt-3">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm font-medium text-primary">
                Começar <ArrowRight className="size-4" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
