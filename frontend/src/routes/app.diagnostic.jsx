import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuestionBank } from "@/hooks/use-question-bank";
import {
  diagnosticPercentage,
  diagnosticAreaResults,
  diagnosticRecommendations,
  evaluateAnswer,
  masteryFromDiagnostic,
  masteryLevel,
} from "@/domain/learning";
import { learningRepository } from "@/services/learning-repository";
export const Route = createFileRoute("/app/diagnostic")({
  component: DiagnosticPage,
});
function DiagnosticPage() {
  const { questions, loading } = useQuestionBank();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const startedAt = useRef(Date.now());
  const question = questions[index];
  const finished = !loading && index >= questions.length;
  const answer = async (option) => {
    if (selected !== null) return;
    const attempt = evaluateAnswer(question, option, Date.now() - startedAt.current);
    setSelected(option);
    setAttempts((current) => [...current, attempt]);
    try {
      await learningRepository.saveAttempt(attempt);
    } catch {
      toast.error("A resposta ficou salva neste navegador, mas não sincronizou com sua conta.");
    }
  };
  const next = async () => {
    const nextIndex = index + 1;
    if (nextIndex === questions.length) {
      const mastery = masteryFromDiagnostic(questions, attempts);
      try {
        await Promise.all([
          learningRepository.saveMastery(mastery),
          learningRepository.saveEvent({
            id: crypto.randomUUID(),
            type: "diagnostic_completed",
            score: diagnosticPercentage(attempts),
            occurredAt: new Date().toISOString(),
          }),
        ]);
      } catch {
        toast.error("O resultado ficou salvo localmente, mas a sincronização falhou.");
      }
    }
    setIndex(nextIndex);
    setSelected(null);
    startedAt.current = Date.now();
  };
  const restart = async () => {
    try {
      await learningRepository.resetDiagnostic();
    } catch {
      toast.error("Não foi possível apagar o diagnóstico da sua conta.");
      return;
    }
    setIndex(0);
    setSelected(null);
    setAttempts([]);
    startedAt.current = Date.now();
  };
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl animate-pulse px-5 py-10 text-muted-foreground">
        Carregando banco de questões…
      </main>
    );
  }
  if (!questions.length) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10 text-muted-foreground">
        Nenhuma questão ativa foi encontrada. Peça a um professor para revisar o banco de questões.
      </main>
    );
  }
  if (finished) {
    const mastery = masteryFromDiagnostic(questions, attempts);
    const percentage = diagnosticPercentage(attempts);
    const areas = diagnosticAreaResults(questions, attempts);
    const insights = diagnosticRecommendations(mastery);
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-sm font-medium text-primary">Diagnóstico concluído</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{percentage}% de acertos</h1>
        <p className="mt-3 text-muted-foreground">
          O resultado por habilidade é mais importante que a média geral.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {mastery
            .sort((a, b) => a.score - b.score)
            .map((item) => (
              <Card key={item.skillId} className="bg-card/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base">{item.label}</CardTitle>
                    <span className="text-sm font-semibold">{item.score}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={item.score} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {masteryLevel(item.score)} · {item.correctAttempts}/{item.attempts} acertos
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="bg-card/70 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Desempenho por área</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {areas.map((area) => (
                <div key={area.area} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{area.area}</span>
                    <strong>{area.score}%</strong>
                  </div>
                  <Progress className="mt-2" value={area.score} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg">Leitura do resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <TrendingUp className="size-4 text-emerald-500" /> Pontos fortes
                </p>
                <p className="mt-1">
                  {insights.strengths.length
                    ? insights.strengths.map((item) => item.label).join(", ")
                    : "Ainda precisamos de mais acertos para confirmar uma habilidade forte."}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <AlertTriangle className="size-4 text-amber-500" /> Lacunas prioritárias
                </p>
                <p className="mt-1">
                  {insights.gaps.length
                    ? insights.gaps.map((item) => item.label).join(", ")
                    : "Nenhuma lacuna crítica foi identificada."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="size-5 text-primary" /> Recomendações e primeiro plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {insights.nextSteps.map((step) => (
                <li key={step.skillId}>• {step.text}</li>
              ))}
            </ul>
            <Button className="mt-5" asChild>
              <Link to="/app/plans">Criar plano com estas prioridades</Link>
            </Button>
          </CardContent>
        </Card>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/app/training">Iniciar treino adaptativo</Link>
          </Button>
          <Button variant="outline" onClick={() => void restart()}>
            <RotateCcw /> Refazer diagnóstico
          </Button>
        </div>
      </main>
    );
  }
  const currentAttempt = attempts.at(-1);
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-primary">{question.area}</span>
        <span className="text-muted-foreground">
          Questão {index + 1} de {questions.length}
        </span>
      </div>
      <Progress className="mt-3" value={(index / questions.length) * 100} />
      <Card className="mt-7 bg-card/70">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">{question.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option, optionIndex) => {
            const isCorrect = selected !== null && optionIndex === question.correctOption;
            const isWrong = selected === optionIndex && !isCorrect;
            return (
              <button
                key={option}
                type="button"
                disabled={selected !== null}
                onClick={() => void answer(optionIndex)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition ${
                  isCorrect
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : isWrong
                      ? "border-destructive/60 bg-destructive/10"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-current/30">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </button>
            );
          })}
          {selected !== null ? (
            <div className="mt-5 rounded-xl bg-muted/50 p-4">
              <p className="flex items-center gap-2 font-medium">
                {currentAttempt?.correct ? (
                  <CheckCircle2 className="text-emerald-500" />
                ) : (
                  <XCircle className="text-destructive" />
                )}
                {currentAttempt?.correct ? "Resposta correta" : "Revise este conceito"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p>
              <Button className="mt-4" onClick={() => void next()}>
                {index === questions.length - 1 ? "Ver resultado" : "Próxima questão"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
