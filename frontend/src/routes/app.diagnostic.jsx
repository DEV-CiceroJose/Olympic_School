import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { DiagnosticReport } from "@/components/assessment/diagnostic-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SCHOOL_CLASSES, assessmentTiming, formatDuration } from "@/domain/assessment";
import { assessmentRepository } from "@/services/assessment-repository";

export const Route = createFileRoute("/app/diagnostic")({ component: DiagnosticPage });
const TYPE = "diagnostico_inicial";

function errorMessage(error) {
  return (
    error?.message?.replace(/^FirebaseError:\s*/, "") || "Não foi possível concluir a operação."
  );
}

function DiagnosticPage() {
  const [definition, setDefinition] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [className, setClassName] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [active, existing] = await Promise.all([
        assessmentRepository.activeDefinition(TYPE),
        assessmentRepository.session(TYPE),
      ]);
      setDefinition(active);
      setSession(existing);
      const assessmentId = existing?.assessmentId || active?.id;
      if (assessmentId) setQuestions(await assessmentRepository.questions(assessmentId));
      if (existing) setResponses(await assessmentRepository.responses(existing.id));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);
  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const responseMap = useMemo(
    () => new Map(responses.map((item) => [item.questionId, item])),
    [responses],
  );
  const current = questions.find((item) => !responseMap.has(item.id));
  const timing = assessmentTiming(session);

  useEffect(() => {
    if (session?.status === "in_progress" && timing.expired) {
      void assessmentRepository
        .finalize(session.id)
        .then(load)
        .catch((error) => toast.error(errorMessage(error)));
    }
  }, [load, session?.id, session?.status, timing.expired]);

  const start = async () => {
    if (!className || !definition) return;
    setSaving(true);
    try {
      await assessmentRepository.start({
        assessmentId: definition.id,
        assessmentType: TYPE,
        className,
      });
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const confirmAnswer = async () => {
    if (selected === null || !current) return;
    setSaving(true);
    try {
      await assessmentRepository.answer({
        sessionId: session.id,
        questionId: current.id,
        selectedOption: selected,
      });
      setSelected(null);
      setResponses(await assessmentRepository.responses(session.id));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await assessmentRepository.finalize(session.id);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl animate-pulse px-5 py-10 text-muted-foreground">
        Carregando avaliação diagnóstica…
      </main>
    );
  }
  if (session?.status === "completed") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-medium text-primary">Diagnóstico inicial concluído</p>
        <h1 className="mb-8 mt-2 font-display text-4xl font-semibold">
          Seu relatório de desempenho
        </h1>
        <DiagnosticReport session={session} />
      </main>
    );
  }
  if (!session) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-sm font-medium text-primary">Avaliação diagnóstica</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Avaliações diagnósticas</h1>
        <p className="mt-3 text-muted-foreground">
          25 questões da 1ª fase da OBB. O diagnóstico final será liberado ao término do projeto.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Disponível</p>
              <p className="mt-2 text-lg font-semibold">Diagnóstico inicial</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mede o ponto de partida antes do uso da plataforma.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 opacity-75">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ainda não liberado
              </p>
              <p className="mt-2 text-lg font-semibold">Diagnóstico final</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Será aplicado ao final do projeto, em uma tentativa separada.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Info icon={Clock3} title="30 a 90 minutos">
            A entrega abre após 30 minutos e o prazo termina em 1h30.
          </Info>
          <Info icon={LockKeyhole} title="Tentativa única">
            Respostas confirmadas não podem ser alteradas e a prova não pode ser refeita.
          </Info>
          <Info icon={Check} title="Resultado ao final">
            Gabarito, desempenho e recomendações aparecem somente após a entrega.
          </Info>
        </div>
        <Card className="mt-6 bg-card/70">
          <CardHeader>
            <CardTitle>Antes de começar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm font-medium" htmlFor="className">
              Selecione sua turma
            </label>
            <select
              id="className"
              className="h-11 w-full rounded-md border bg-background px-3"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            >
              <option value="">Escolha uma turma</option>
              {SCHOOL_CLASSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            {definition ? (
              <Button disabled={!className || saving} onClick={() => void start()}>
                {saving ? "Iniciando…" : "Iniciar diagnóstico"}
              </Button>
            ) : (
              <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700">
                A avaliação ainda não foi publicada. O professor deve importar a planilha com as 25
                questões.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-medium text-primary">{session.assessmentTitle}</span>
        <span className="flex items-center gap-2">
          <Clock3 className="size-4" /> {formatDuration(timing.secondsRemaining)} restantes
        </span>
      </div>
      <Progress className="mt-3" value={(responses.length / questions.length) * 100} />
      <p className="mt-2 text-xs text-muted-foreground">
        {responses.length} de {questions.length} respostas confirmadas · Turma {session.className}
      </p>
      {current ? (
        <Card className="mt-7 bg-card/70">
          <CardHeader>
            <p className="text-sm text-muted-foreground">
              Questão {current.order} · {current.area}
            </p>
            <CardTitle className="text-xl leading-relaxed">{current.prompt}</CardTitle>
            {current.supportText ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {current.supportText}
              </p>
            ) : null}
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={`Imagem de apoio da questão ${current.order}`}
                className="max-h-96 rounded-xl border object-contain"
              />
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {current.options.map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelected(index)}
                className={`flex w-full gap-3 rounded-xl border p-4 text-left text-sm transition ${selected === index ? "border-primary bg-primary/10" : "hover:border-primary/50"}`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full border">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
            <Button disabled={selected === null || saving} onClick={() => void confirmAnswer()}>
              Confirmar resposta
            </Button>
            <p className="text-xs text-muted-foreground">
              Depois de confirmar, esta resposta não poderá ser alterada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-7 bg-card/70">
          <CardHeader>
            <CardTitle>Todas as respostas foram confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            {timing.canSubmit ? (
              <Button disabled={saving} onClick={() => void finish()}>
                Entregar e gerar relatório
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                A entrega será liberada em {formatDuration(timing.secondsUntilSubmit)}. Respostas
                confirmadas permanecem bloqueadas.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Info({ icon: Icon, title, children }) {
  return (
    <Card className="bg-card/70">
      <CardContent className="p-5">
        <Icon className="size-5 text-primary" />
        <p className="mt-3 font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}
