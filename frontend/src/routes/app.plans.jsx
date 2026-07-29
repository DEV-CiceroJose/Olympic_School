import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { artifactRepository } from "@/services/artifact-repository";
import { learningRepository } from "@/services/learning-repository";
import { studyPlanRepository } from "@/services/study-plan-repository";
import { generateStudyPlan } from "@/domain/study-plan";
export const Route = createFileRoute("/app/plans")({
  component: PlansPage,
});
const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const activityLabels = {
  concept: "Conceito guiado",
  questions: "Questões",
  review: "Revisão",
  simulation: "Simulado",
};
function PlansPage() {
  const [loaded, setLoaded] = useState(false);
  const [plans, setPlans] = useState([]);
  const [target, setTarget] = useState("OBB");
  const [examDate, setExamDate] = useState("");
  const [minutes, setMinutes] = useState(45);
  const [days, setDays] = useState(["Terça", "Quinta", "Sábado"]);
  useEffect(() => {
    studyPlanRepository
      .list()
      .then(setPlans)
      .finally(() => setLoaded(true));
  }, []);
  const createPlan = async () => {
    const id = `plan-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const mastery = await learningRepository.getMastery();
    const plan = generateStudyPlan(
      id,
      createdAt,
      {
        targetOlympiad: target.trim() || "Olimpíada de Biologia",
        examDate: examDate || undefined,
        availableDays: days,
        minutesPerDay: Math.max(15, minutes),
      },
      mastery,
    );
    await studyPlanRepository.save(plan);
    await artifactRepository.save({
      id: `artifact-${id}`,
      kind: "study-plan",
      title: `Plano ${plan.input.targetOlympiad}`,
      content: [
        plan.objective,
        "",
        ...plan.sessions.map(
          (session) =>
            `- Semana ${session.week}, ${session.day}: ${session.topic} — ${activityLabels[session.activity]} (${session.minutes} min)`,
        ),
      ].join("\n"),
      createdAt,
    });
    setPlans((current) => [plan, ...current]);
  };
  const toggle = async (planId, sessionId) => {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;
    const updated = await studyPlanRepository.toggleSession(plan, sessionId);
    setPlans((current) => current.map((item) => (item.id === planId ? updated : item)));
  };
  if (!loaded) {
    return <main className="px-5 py-10 text-muted-foreground">Carregando planos…</main>;
  }
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Plano de estudo</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Organize sua preparação</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        O gerador prioriza as habilidades com menor domínio registrado e intercala conceito,
        questões, revisão e simulado.
      </p>

      <Card className="mt-8 bg-card/70">
        <CardHeader>
          <CardTitle>Novo plano</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="target">Olimpíada</Label>
            <Input id="target" value={target} onChange={(event) => setTarget(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-date">Data da prova</Label>
            <Input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={(event) => setExamDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minutes">Minutos por sessão</Label>
            <Input
              id="minutes"
              type="number"
              min={15}
              max={240}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
            />
          </div>
          <fieldset className="md:col-span-3">
            <legend className="text-sm font-medium">Dias disponíveis</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setDays((current) =>
                      current.includes(day)
                        ? current.filter((item) => item !== day)
                        : [...current, day],
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    days.includes(day)
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-3">
            <Button onClick={createPlan} disabled={!days.length}>
              <CalendarDays /> Gerar plano
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-5">
        {plans.map((plan) => {
          const completed = plan.sessions.filter((session) => session.completed).length;
          return (
            <Card key={plan.id} className="bg-card/70">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{plan.input.targetOlympiad}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {completed}/{plan.sessions.length} sessões
                  </span>
                </div>
                <Progress value={(completed / plan.sessions.length) * 100} />
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {plan.sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => void toggle(plan.id, session.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${
                      session.completed
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <CheckCircle2
                      className={`mt-0.5 size-4 shrink-0 ${session.completed ? "text-emerald-500" : "text-muted-foreground"}`}
                    />
                    <span>
                      <strong className="block">{session.topic}</strong>
                      <span className="text-xs text-muted-foreground">
                        Semana {session.week} · {session.day} · {activityLabels[session.activity]} ·{" "}
                        {session.minutes} min
                      </span>
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Seus planos e sessões concluídas são persistidos na sua conta.
      </p>
    </main>
  );
}
