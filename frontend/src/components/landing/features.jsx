import {
  BarChart3,
  BrainCircuit,
  Clock,
  Compass,
  FileSpreadsheet,
  FileText,
  Network,
  Sparkles,
} from "lucide-react";
import { Reveal } from "./reveal";
const planned = "border-border bg-surface/60 text-muted-foreground";
const inProgress = "border-primary/30 bg-primary/15 text-primary";
const features = [
  {
    id: "resumos",
    title: "Resumos Personalizados",
    description:
      "Sínteses inteligentes focadas em artigos científicos e no banco de questões históricas das Olimpíadas.",
    status: "Em desenvolvimento",
    icon: FileText,
    tagColor: inProgress,
  },
  {
    id: "mapas",
    title: "Mapas Mentais Visuais",
    description:
      "Diagramas estruturados para organizar reações metabólicas, sistemática e teias ecológicas.",
    status: "Em desenvolvimento",
    icon: Network,
    tagColor: inProgress,
  },
  {
    id: "pdfs",
    title: "PDFs e Slides de Estudo",
    description:
      "Material sintetizado e formatado para leitura rápida no celular ou revisão presencial.",
    status: "Próxima etapa",
    icon: FileSpreadsheet,
    tagColor: planned,
  },
  {
    id: "questoes",
    title: "Questões de Biologia Comentadas",
    description:
      "Exercícios das edições passadas da OBB, OBBS e TNBIO com resolução passo a passo.",
    status: "Em desenvolvimento",
    icon: BrainCircuit,
    tagColor: inProgress,
  },
  {
    id: "trilhas",
    title: "Trilhas de Estudo por Fase",
    description: "Cronograma estratégico ajustado de acordo com a data de cada prova olímpica.",
    status: "Planejado",
    icon: Compass,
    tagColor: planned,
  },
  {
    id: "desempenho",
    title: "Análise de Desempenho Individual",
    description: "Relatórios demonstrando a taxa de acerto por grande área da biologia.",
    status: "Planejado",
    icon: BarChart3,
    tagColor: planned,
  },
];
export function Features() {
  return (
    <section id="recursos" className="border-b border-border bg-background py-24 text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            <span>Estrutura Futura</span>
          </div>

          <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
            O que estamos <span className="text-primary italic">construindo</span>
          </h2>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-base">
            Conheça os recursos educacionais planejados para os próximos lançamentos da plataforma
            Olympic School.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => (
            <Reveal key={item.id} delay={index * 60}>
              <div className="group flex h-full flex-col justify-between rounded-3xl border border-primary/25 bg-card p-8 shadow-soft transition-all duration-300 hover:border-primary">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/40 bg-surface text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="size-6" aria-hidden="true" />
                    </div>
                    <span
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${item.tagColor}`}
                    >
                      <Clock className="size-3" aria-hidden="true" />
                      <span>{item.status}</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold transition-colors group-hover:text-primary-glow">
                    {item.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 border-t border-border pt-4 text-[11px] uppercase text-muted-foreground">
                  Recurso Planejado
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
