import { createFileRoute, Link } from "@tanstack/react-router";
import { BrainCircuit, CalendarClock, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/app/plans")({
  component: PlansPage,
});

function PlansPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Plano de estudos</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Sua preparação em um só lugar</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Esta área será definida a partir dos resultados do diagnóstico e da metodologia de
        acompanhamento da escola.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <ClipboardCheck className="size-6 text-primary" />
            <CardTitle className="pt-3">Primeiro passo: diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O diagnóstico identifica pontos fortes e lacunas que poderão orientar o plano.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/app/diagnostic">Acessar diagnóstico</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/70">
          <CardHeader>
            <BrainCircuit className="size-6 text-primary" />
            <CardTitle className="pt-3">Treino adaptativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O treino adaptativo fará parte do plano de estudos. A dinâmica ainda está em definição
              e será disponibilizada em uma próxima etapa.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <CalendarClock className="size-5 shrink-0 text-primary" />O plano permanecerá em preparação
        até a escola concluir a definição de uso da plataforma.
      </div>
    </main>
  );
}
