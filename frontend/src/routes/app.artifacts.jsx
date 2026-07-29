import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Files } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { artifactLabels } from "@/domain/artifacts";
import { artifactRepository } from "@/services/artifact-repository";
export const Route = createFileRoute("/app/artifacts")({
  component: ArtifactsPage,
});
function ArtifactsPage() {
  const [loaded, setLoaded] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  useEffect(() => {
    artifactRepository
      .list()
      .then(setArtifacts)
      .finally(() => setLoaded(true));
  }, []);
  if (!loaded) {
    return <main className="px-5 py-10 text-muted-foreground">Carregando artefatos…</main>;
  }
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Materiais salvos</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Artefatos de estudo</h1>
      <p className="mt-3 text-muted-foreground">
        Resumos, questões, flashcards, mapas mentais e planos que você decidiu guardar.
      </p>
      {artifacts.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {artifacts.map((artifact) => (
            <Card key={artifact.id} className="bg-card/70">
              <CardHeader>
                <span className="text-xs font-medium text-primary">
                  {artifactLabels[artifact.kind]}
                </span>
                <CardTitle>{artifact.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-4 font-sans text-sm text-muted-foreground">
                  {artifact.content}
                </pre>
                <Button
                  className="mt-4"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(artifact.content);
                    toast.success("Artefato copiado.");
                  }}
                >
                  <Copy /> Copiar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-8 bg-card/70">
          <CardContent className="py-12 text-center">
            <Files className="mx-auto size-9 text-primary" />
            <p className="mt-4 font-medium">Nenhum artefato salvo</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gere um recurso no chat ou crie um plano de estudo.
            </p>
          </CardContent>
        </Card>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Seus materiais são privados e persistidos na sua conta.
      </p>
    </main>
  );
}
