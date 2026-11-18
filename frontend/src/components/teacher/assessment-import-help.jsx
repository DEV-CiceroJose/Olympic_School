import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ASSESSMENT_TYPE_LABELS } from "@/domain/assessment";
import { buildAssessmentImportKit, downloadImportKit } from "@/services/assessment-import-kit";

export function AssessmentImportHelp() {
  const id = useId();
  const [type, setType] = useState("simulado");
  const [count, setCount] = useState("10");
  function kit() {
    return buildAssessmentImportKit(type, count);
  }
  return (
    <section
      className="space-y-4 rounded-xl border p-4"
      aria-label="Modelo e instruções para importação"
    >
      <h3 className="font-medium">Modelo com regras e instruções para a IA</h3>
      <p className="text-sm text-muted-foreground">
        Envie à IA o modelo, as instruções e o documento original da prova, como PDF ou DOCX. O
        comando pede um CSV com as figuras incorporadas.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <label htmlFor={`${id}-type`} className="block">
            Tipo do modelo
          </label>
          <select
            id={`${id}-type`}
            className="h-10 w-full rounded-md border bg-background px-3"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {Object.entries(ASSESSMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="space-y-2 text-sm">
          <span className="block">Quantidade de questões do modelo</span>
          <Input
            type="number"
            min={1}
            max={30}
            disabled={type !== "simulado"}
            value={type === "simulado" ? count : "25"}
            onChange={(event) => setCount(event.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Simulado: 1 a 30 questões. Diagnósticos: exatamente 25. Nos dois casos, cinco alternativas
        de A a E.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            try {
              downloadImportKit(kit());
            } catch (error) {
              toast.error(error.message);
            }
          }}
        >
          Baixar modelo + regras (ZIP)
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const content = kit();
              await navigator.clipboard.writeText(`${content.prompt}\n${content.instructions}`);
              toast.success("Comando e regras copiados. Envie também o modelo e as fontes à IA.");
            } catch {
              toast.error("Não foi possível copiar. Baixe o pacote e use os arquivos de texto.");
            }
          }}
        >
          Copiar instruções para a IA
        </Button>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">
          Como conferir as figuras e completar pendências
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>Importe o CSV, clique em Abrir no editor e confira as figuras na prévia.</li>
          <li>
            Se a IA não conseguir incorporar uma figura necessária, ela deve marcar
            [IMAGEM_PENDENTE] nas observações da questão.
          </li>
          <li>
            Para completar a pendência, extraia ou capture a figura no documento original e anexe-a
            à questão correspondente.
          </li>
        </ol>
      </details>
    </section>
  );
}
