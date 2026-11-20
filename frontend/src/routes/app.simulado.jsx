import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AssessmentPage } from "@/components/assessment/assessment-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toDate } from "@/domain/assessment";
import { assessmentRepository } from "@/services/assessment-repository";

export const Route = createFileRoute("/app/simulado")({
  validateSearch: ({ avaliacao }) => ({
    avaliacao:
      typeof avaliacao === "string" && /^[a-z0-9][a-z0-9-]{2,127}$/.test(avaliacao)
        ? avaliacao
        : undefined,
  }),
  component: MockExamRoute,
});

function MockExamRoute() {
  const { avaliacao } = Route.useSearch();
  if (!avaliacao) return <MockExams />;
  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pt-5">
        <Link className="text-sm font-medium text-primary underline" to="/app/simulado" search={{}}>
          Voltar para simulados
        </Link>
      </div>
      <AssessmentPage key={avaliacao} assessmentId={avaliacao} />
    </>
  );
}

function MockExams() {
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      assessmentRepository.activeDefinition("simulado"),
      assessmentRepository.mockSessions(),
    ]).then(
      ([active, sessions]) => {
        if (ignore) return;
        sessions.sort(
          (a, b) => (toDate(b.startedAt)?.getTime() ?? 0) - (toDate(a.startedAt)?.getTime() ?? 0),
        );
        setResult({ active, sessions });
      },
      () => {
        if (!ignore) setLoadError(true);
      },
    );
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const active = result?.active;
  const activeSession = result?.sessions.find((session) => session.assessmentId === active?.id);
  const previousSessions = result?.sessions.filter(
    (session) => session.assessmentId !== active?.id,
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-10">
      <h1 className="font-display text-4xl font-semibold">Simulados</h1>
      {loadError ? (
        <div className="space-y-3">
          <p role="alert">Não foi possível carregar os simulados.</p>
          <Button
            onClick={() => {
              setLoadError(false);
              setAttempt((current) => current + 1);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !result ? (
        <p role="status">Carregando simulados…</p>
      ) : (
        <>
          {active ? (
            <MockExamCard title={active.title} id={active.id} status={activeSession?.status} />
          ) : (
            <p className="text-muted-foreground">Nenhum simulado está disponível agora.</p>
          )}
          {previousSessions.length > 0 && (
            <section className="space-y-3" aria-labelledby="mock-exam-history">
              <h2 id="mock-exam-history" className="text-xl font-semibold">
                Outros simulados iniciados
              </h2>
              {previousSessions.map((session) => (
                <MockExamCard
                  key={session.id}
                  title={session.assessmentTitle}
                  id={session.assessmentId}
                  status={session.status}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}

const actionByStatus = {
  in_progress: "Retomar simulado",
  completed: "Ver resultado",
};

function MockExamCard({ title, id, status }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="font-semibold">{title}</p>
        <Button asChild>
          <Link to="/app/simulado" search={{ avaliacao: id }}>
            {actionByStatus[status] ?? "Abrir simulado"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
