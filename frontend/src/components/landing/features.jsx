import { BarChart3, BrainCircuit, Compass, FileSpreadsheet, FileText, Network } from "lucide-react";
import { Reveal } from "./reveal";
const features = [
  {
    id: "resumos",
    title: "Resumos Personalizados",
    description:
      "Sínteses inteligentes focadas em artigos científicos e no banco de questões históricas das Olimpíadas.",
    icon: FileText,
  },
  {
    id: "mapas",
    title: "Mapas Mentais Visuais",
    description:
      "Diagramas estruturados para organizar reações metabólicas, sistemática e teias ecológicas.",
    icon: Network,
  },
  {
    id: "pdfs",
    title: "PDFs e Slides de Estudo",
    description:
      "Material sintetizado e formatado para leitura rápida no celular ou revisão presencial.",
    icon: FileSpreadsheet,
  },
  {
    id: "questoes",
    title: "Questões de Biologia Comentadas",
    description:
      "Exercícios das edições passadas da OBB, OBBS e TNBIO com resolução passo a passo.",
    icon: BrainCircuit,
  },
  {
    id: "trilhas",
    title: "Trilhas de Estudo por Fase",
    description: "Cronograma estratégico ajustado de acordo com a data de cada prova olímpica.",
    icon: Compass,
  },
  {
    id: "desempenho",
    title: "Análise de Desempenho Individual",
    description: "Relatórios demonstrando a taxa de acerto por grande área da biologia.",
    icon: BarChart3,
  },
];
export function Features() {
  return (
    <section id="recursos" className="border-b border-border bg-background py-24 text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-12 max-w-4xl space-y-4 text-center">
          <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
            <span className="text-primary">O que estamos construindo?</span>
          </h2>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-base">
            Conheça os recursos educacionais planejados para os próximos lançamentos da plataforma
            Olympic School.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => (
            <Reveal key={item.id} delay={index * 60}>
              <div className="pdf-info-card group flex h-full flex-col justify-between rounded-3xl border border-primary/25 p-7 shadow-soft transition-all duration-300 hover:border-primary">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="pdf-card-icon flex size-12 items-center justify-center rounded-2xl border border-primary/40 bg-surface text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="size-6" aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="pdf-card-pill text-xl font-bold transition-colors group-hover:text-primary-glow">
                    {item.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
