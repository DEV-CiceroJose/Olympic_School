import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CloudOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notebookRepository } from "@/services/notebook-repository";
export const Route = createFileRoute("/app/notebooks")({
  component: NotebooksPage,
});
function NotebooksPage() {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    notebookRepository
      .list({ includeInactive: true })
      .then(setNotebooks)
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Biblioteca externa</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Gemini Notebook</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Estes materiais abrem em uma nova aba. O conteúdo externo não está sincronizado, indexado ou
        disponível automaticamente para a IA da Olympic School.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {loading ? <p className="text-sm text-muted-foreground">Carregando notebooks…</p> : null}
        {notebooks.map((notebook) => (
          <Card key={notebook.id} className="bg-card/70">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <BookOpen className="size-6 text-primary" />
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${notebook.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}
                >
                  {notebook.isActive ? "Disponível" : "Aguardando link"}
                </span>
              </div>
              <CardTitle className="pt-3">{notebook.title}</CardTitle>
              <p className="text-xs text-primary">{notebook.subject}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{notebook.description}</p>
              {notebook.isActive ? (
                <a
                  href={notebook.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Abrir em nova aba <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <span className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <CloudOff className="size-4" /> Nenhuma sincronização configurada
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
