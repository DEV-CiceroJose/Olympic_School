import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { masteryLevel } from "@/domain/learning";
import { learningRepository } from "@/services/learning-repository";
export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});
function ProgressPage() {
  const [loaded, setLoaded] = useState(false);
  const [mastery, setMastery] = useState([]);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    learningRepository
      .getSnapshot()
      .then((snapshot) => {
        setMastery(snapshot.mastery.sort((a, b) => a.score - b.score));
        setEvents(snapshot.events);
      })
      .finally(() => setLoaded(true));
  }, []);
  if (!loaded) {
    return (
      <main className="mx-auto max-w-5xl animate-pulse px-5 py-10 text-muted-foreground">
        Carregando seu progresso…
      </main>
    );
  }
  if (!mastery.length) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <BarChart3 className="mx-auto size-10 text-primary" />
        <h1 className="mt-5 font-display text-3xl font-semibold">
          Seu progresso começa com evidências
        </h1>
        <p className="mt-3 text-muted-foreground">
          Nenhum dado de aprendizagem foi registrado. Conclua o diagnóstico para criar seu mapa.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/app/diagnostic">Fazer diagnóstico</Link>
        </Button>
      </main>
    );
  }
  const average = Math.round(mastery.reduce((sum, item) => sum + item.score, 0) / mastery.length);
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Progresso objetivo</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">{average} de domínio médio</h1>
          <p className="mt-2 text-muted-foreground">
            Calculado a partir de {events.length} eventos sincronizados com sua conta.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/training">Continuar treinamento</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {mastery.map((item, index) => (
          <Card key={item.skillId} className="bg-card/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{item.label}</CardTitle>
                <span className="font-semibold">{item.score}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={item.score} />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {index < 3 ? <AlertTriangle className="size-3 text-amber-500" /> : null}
                  {masteryLevel(item.score)}
                </span>
                <span>
                  {item.correctAttempts}/{item.attempts} · confiança {item.confidence}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        Seu progresso fica na área privada da sua conta e também mantém uma cópia local para
        recuperação em caso de falha temporária de conexão.
      </p>
    </main>
  );
}
