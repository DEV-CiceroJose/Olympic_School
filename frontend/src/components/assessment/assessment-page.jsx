import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { ProfileDialog } from "@/components/auth/profile-dialog";
import { DiagnosticReport } from "@/components/assessment/diagnostic-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { assessmentTiming, formatDuration, registeredSchoolClass } from "@/domain/assessment";
import { assessmentRepository } from "@/services/assessment-repository";

function errorMessage(error) {
  return (
    error?.message?.replace(/^FirebaseError:\s*/, "") || "Não foi possível concluir a operação."
  );
}

export function AssessmentPage({ assessmentId }) {
  const isMockExam = Boolean(assessmentId);
  const type = isMockExam ? "simulado" : "diagnostico_inicial";
  const title = isMockExam ? "Simulado" : "Avaliações diagnósticas";
  const { profile, completeProfile } = useAuth();
  const className = registeredSchoolClass(profile?.turma);
  const [definition, setDefinition] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const existing = isMockExam
        ? (await assessmentRepository.mockSessions(assessmentId))[0]
        : await assessmentRepository.session(type);
      const active = existing ? null : await assessmentRepository.activeDefinition(type);
      setDefinition(!isMockExam || active?.id === assessmentId ? active : null);
      setSession(existing);
      if (existing?.status === "in_progress") {
        const [items, answers] = await Promise.all([
          assessmentRepository.questions(existing.assessmentId),
          assessmentRepository.responses(existing.id),
        ]);
        setQuestions(items);
        setResponses(answers);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [assessmentId, isMockExam, type]);

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
        assessmentType: type,
        className,
      });
      await load();
    } catch (error) {
      const unavailable = ["functions/internal", "functions/not-found", "functions/unavailable"];
      toast.error(
        unavailable.includes(error?.code)
          ? "O serviço que inicia a avaliação está indisponível. Tente novamente mais tarde."
          : errorMessage(error),
      );
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
        Carregando avaliação…
      </main>
    );
  }
  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-5 py-10">
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p role="alert">Não foi possível carregar a avaliação.</p>
        <Button onClick={() => void load()}>Tentar novamente</Button>
      </main>
    );
  }
  if (session?.status === "completed") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-medium text-primary">
          {isMockExam ? session.assessmentTitle : "Diagnóstico inicial concluído"}
        </p>
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
        {isMockExam ? (
          <>
            <h1 className="font-display text-4xl font-semibold">{definition?.title ?? title}</h1>
            {definition && (
              <p className="mt-3 text-muted-foreground">{definition.questionCount} questões.</p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-primary">Avaliação diagnóstica</p>
            <h1 className="mt-2 font-display text-4xl font-semibold">{title}</h1>
            <p className="mt-3 text-muted-foreground">
              25 questões da 1ª fase da OBB. O diagnóstico final será liberado ao término do
              projeto.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {definition ? "Disponível" : "Ainda não publicado"}
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {definition?.title || "Diagnóstico inicial"}
                  </p>
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
          </>
        )}
        {(!isMockExam || definition) && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Info icon={Clock3} title={`Até ${definition?.maxMinutes ?? 90} minutos`}>
              {isMockExam
                ? `Você poderá entregar após ${definition?.minMinutes} min e confirmar todas as respostas.`
                : "Entregue assim que confirmar todas as respostas, dentro do prazo da prova."}
            </Info>
            <Info icon={LockKeyhole} title="Tentativa única">
              Respostas confirmadas não podem ser alteradas e a prova não pode ser refeita.
            </Info>
            <Info icon={Check} title="Resultado ao final">
              Gabarito, desempenho e recomendações aparecem somente após a entrega.
            </Info>
          </div>
        )}
        <Card className="mt-6 bg-card/70">
          <CardHeader>
            <CardTitle>Antes de começar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!definition ? (
              <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700">
                {isMockExam
                  ? "Este simulado não está disponível."
                  : "A avaliação ainda não foi publicada."}
              </p>
            ) : className ? (
              <>
                <p className="text-sm text-muted-foreground">Sua turma é {className}.</p>
                <Button disabled={saving} onClick={() => void start()}>
                  {saving ? "Iniciando…" : isMockExam ? "Iniciar simulado" : "Iniciar diagnóstico"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Atualize a turma do seu cadastro para começar.
                </p>
                <Button onClick={() => setEditingProfile(true)}>Atualizar cadastro</Button>
                <ProfileDialog
                  open={editingProfile}
                  defaultName={profile?.name}
                  onOpenChange={setEditingProfile}
                  onSubmit={completeProfile}
                  onCompleted={() => setEditingProfile(false)}
                  updating
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="platform-assessment">
      <div className="platform-assessment-meta">
        <span className="font-medium text-primary">{session.assessmentTitle}</span>
        <span className="flex items-center gap-2">
          <Clock3 className="size-4" /> {formatDuration(timing.secondsRemaining)} restantes
        </span>
      </div>
      <Progress
        className="mt-3 h-1"
        value={(responses.length / Math.max(1, questions.length)) * 100}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {responses.length} de {questions.length} respostas confirmadas · Turma {session.className}
      </p>
      {current ? (
        <section className="mt-6" aria-labelledby="diagnostic-question">
          <div className="platform-question-meta">
            <span>{current.area}</span>
            <span>
              Questão {current.order} de {questions.length}
            </span>
          </div>
          <Card className="platform-question">
            <CardHeader className="platform-question-header">
              <h1
                id="diagnostic-question"
                className="max-w-2xl text-xl leading-snug font-semibold sm:text-2xl"
              >
                {current.prompt}
              </h1>
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
            <CardContent className="platform-question-options">
              {current.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-pressed={selected === index}
                  className="platform-answer flex w-full max-w-lg items-center gap-3 text-left"
                >
                  <span className="platform-answer-letter grid size-8 shrink-0 place-items-center rounded-full">
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
        </section>
      ) : (
        <Card className="mt-7 bg-card/70">
          <CardHeader>
            <CardTitle>Todas as respostas foram confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              disabled={saving || timing.secondsUntilSubmission > 0}
              onClick={() => void finish()}
            >
              Entregar e gerar relatório
            </Button>
            {timing.secondsUntilSubmission > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Entrega disponível em {formatDuration(timing.secondsUntilSubmission)}.
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
