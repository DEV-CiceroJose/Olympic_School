import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Target, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuestionBank } from "@/hooks/use-question-bank";
import {
  adaptiveReasonFor,
  evaluateAnswer,
  masteryLevel,
  selectNextQuestion,
  updateMastery,
} from "@/domain/learning";
import { learningRepository } from "@/services/learning-repository";
import { studyPlanRepository } from "@/services/study-plan-repository";
export const Route = createFileRoute("/app/training")({
  component: TrainingPage,
});
function TrainingPage() {
  const { questions, loading: questionsLoading } = useQuestionBank();
  const [loaded, setLoaded] = useState(false);
  const [mastery, setMastery] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const startedAt = useRef(Date.now());
  useEffect(() => {
    Promise.all([learningRepository.getSnapshot(), studyPlanRepository.list().catch(() => [])])
      .then(([snapshot, savedPlans]) => {
        setMastery(snapshot.mastery);
        setAttempts(snapshot.attempts);
        setPlans(savedPlans);
      })
      .finally(() => setLoaded(true));
  }, []);
  if (!loaded || questionsLoading) {
    return (
      <main className="mx-auto max-w-3xl animate-pulse px-5 py-10 text-muted-foreground">
        Carregando seu treino…
      </main>
    );
  }
  const currentPlan = plans[0];
  const adaptiveContext = {
    targetOlympiad: currentPlan?.input.targetOlympiad,
    priorityTopics: [
      ...(currentPlan?.input.priorityTopics ?? []),
      ...(currentPlan?.sessions
        .filter((session) => !session.completed)
        .map((session) => session.topic) ?? []),
    ],
  };
  const question = selectNextQuestion(questions, mastery, attempts, adaptiveContext);
  if (!question) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10 text-muted-foreground">
        Nenhuma questão ativa está disponível para o treino.
      </main>
    );
  }
  const currentSkill = mastery.find((item) => item.skillId === question.skillId);
  const adaptiveReason = adaptiveReasonFor(question, mastery, attempts, adaptiveContext);
  const latestAttempt = attempts.at(-1);
  if (!mastery.length) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <Target className="mx-auto size-10 text-primary" />
        <h1 className="mt-5 font-display text-3xl font-semibold">
          Precisamos medir seu ponto de partida
        </h1>
        <p className="mt-3 text-muted-foreground">
          Faça o diagnóstico antes do treino para que a seleção das questões use evidências reais.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/app/diagnostic">Começar diagnóstico</Link>
        </Button>
      </main>
    );
  }
  const answer = async (option) => {
    if (selected !== null) return;
    const attempt = evaluateAnswer(question, option, Date.now() - startedAt.current);
    const existing = mastery.find((item) => item.skillId === question.skillId) ?? {
      skillId: question.skillId,
      label: question.skillLabel,
      score: 0,
      attempts: 0,
      correctAttempts: 0,
      confidence: "low",
    };
    const updated = updateMastery(existing, attempt);
    const nextMastery = mastery.map((item) => (item.skillId === updated.skillId ? updated : item));
    setSelected(option);
    setAttempts((current) => [...current, attempt]);
    setMastery(nextMastery);
    try {
      await Promise.all([
        learningRepository.saveAttempt(attempt),
        learningRepository.saveMastery(nextMastery),
        learningRepository.saveEvent({
          id: crypto.randomUUID(),
          type: "training_attempt",
          skillId: question.skillId,
          score: updated.score,
          occurredAt: attempt.answeredAt,
        }),
      ]);
    } catch {
      toast.error("O treino ficou salvo localmente, mas a sincronização falhou.");
    }
  };
  const next = () => {
    setSelected(null);
    startedAt.current = Date.now();
  };
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Treino adaptativo</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{question.skillLabel}</h1>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Domínio {currentSkill?.score ?? 0} · {masteryLevel(currentSkill?.score ?? 0)}
        </span>
      </div>
      <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Por que esta atividade?</strong> {adaptiveReason}
      </p>
      <Card className="mt-7 bg-card/70">
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Dificuldade{" "}
            {question.difficulty === 1
              ? "introdutória"
              : question.difficulty === 2
                ? "intermediária"
                : "avançada"}
          </p>
          <CardTitle className="pt-2 text-xl leading-relaxed">{question.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              disabled={selected !== null}
              onClick={() => void answer(optionIndex)}
              className="w-full rounded-xl border border-border p-4 text-left text-sm transition hover:border-primary/50 hover:bg-primary/5 disabled:cursor-default"
            >
              {String.fromCharCode(65 + optionIndex)}. {option}
            </button>
          ))}
          {selected !== null ? (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="flex items-center gap-2 font-medium">
                {latestAttempt?.correct ? (
                  <CheckCircle2 className="text-emerald-500" />
                ) : (
                  <XCircle className="text-destructive" />
                )}
                {latestAttempt?.correct
                  ? "Você consolidou esta habilidade"
                  : "Erro conceitual registrado"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p>
              <Button className="mt-4" onClick={next}>
                Selecionar próxima atividade
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
