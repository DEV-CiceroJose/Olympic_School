import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, ClipboardCheck, Target } from "lucide-react";
import { DiagnosticReport } from "@/components/assessment/diagnostic-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { assessmentRepository } from "@/services/assessment-repository";

export const Route = createFileRoute("/app/")({ component: LearningHome });

function LearningHome() {
  const { profile } = useAuth();
  const [session, setSession] = useState(null);
  useEffect(() => {
    void assessmentRepository
      .session()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);
  const completed = session?.status === "completed";
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        Visão geral
      </span>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">
        Olá, {profile?.name?.split(" ")[0] || "estudante"}.
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Aqui você acompanha o diagnóstico, suas prioridades e o estado do plano de estudos.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="bg-card/70">
          <CardHeader>
            <ClipboardCheck className="size-6 text-primary" />
            <CardTitle className="pt-2">Diagnóstico inicial</CardTitle>
            <CardDescription>
              {completed
                ? "Concluído — relatório disponível"
                : session
                  ? "Em andamento"
                  : "Aguardando realização"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={
                completed
                  ? 100
                  : session
                    ? (session.answeredCount / session.questionCount) * 100
                    : 0
              }
            />
            <Button asChild variant="link" className="mt-3 px-0">
              <Link to="/app/diagnostic">
                {completed ? "Ver relatório" : session ? "Continuar" : "Começar"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-card/70">
          <CardHeader>
            <Target className="size-6 text-primary" />
            <CardTitle className="pt-2">Prioridade atual</CardTitle>
            <CardDescription>
              {completed
                ? session.report?.areaResults
                    ?.slice()
                    .sort((a, b) => a.percentage - b.percentage)[0]?.area || "A analisar"
                : "Conclua o diagnóstico para descobrir"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A análise usa seu desempenho por área e habilidade.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70">
          <CardHeader>
            <BookOpenCheck className="size-6 text-primary" />
            <CardTitle className="pt-2">Plano de estudos</CardTitle>
            <CardDescription>Estrutura em definição</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O futuro treino adaptativo ficará vinculado ao plano.
            </p>
            <Button asChild variant="link" className="mt-3 px-0">
              <Link to="/app/plans">
                Ver organização
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      {completed ? (
        <div className="mt-10">
          <h2 className="mb-5 font-display text-2xl font-semibold">Seu último relatório</h2>
          <DiagnosticReport session={session} />
        </div>
      ) : null}
    </main>
  );
}
