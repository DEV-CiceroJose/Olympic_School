import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CloudOff, Library } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notebookRepository } from "@/services/notebook-repository";

export const Route = createFileRoute("/app/reds")({
  component: RedsPage,
});

function RedsPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notebookRepository
      .list()
      .then(setResources)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Recursos Educacionais Digitais</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">REDs</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Consulte os notebooks no NotebookLM e os materiais preparados pela professora para apoiar
        seus estudos.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando recursos…</p>
      ) : resources.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <Card key={resource.id} className="bg-card/70">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <BookOpen className="size-6 text-primary" />
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                    Disponível
                  </span>
                </div>
                <CardTitle className="pt-3">{resource.title}</CardTitle>
                <p className="text-xs text-primary">{resource.subject}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Abrir recurso <ArrowUpRight className="size-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-8 bg-card/70">
          <CardContent className="py-12 text-center">
            <CloudOff className="mx-auto size-9 text-primary" />
            <p className="mt-4 font-medium">Nenhum recurso disponível</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Os materiais publicados pela professora aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <Library className="size-5 shrink-0 text-primary" />
        Os REDs são materiais de consulta produzidos e selecionados pela equipe docente.
      </div>
    </main>
  );
}
