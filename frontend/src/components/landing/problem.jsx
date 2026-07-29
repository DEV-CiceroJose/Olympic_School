import { Activity, AlertCircle, Compass, FileQuestion, Layers } from "lucide-react";
import { Reveal } from "./reveal";
const problems = [
  {
    icon: FileQuestion,
    title: "Conteúdos Dispersos",
    description:
      "A matéria de olimpíadas está espalhada em apostilas antigas, sites variados e livros universitários extensos e sem direcionamento.",
  },
  {
    icon: Compass,
    title: "Falta de Direcionamento",
    description:
      "Dificuldade para identificar quais tópicos de Botânica, Genética, Ecologia e Fisiologia têm maior incidência nas provas.",
  },
  {
    icon: Layers,
    title: "Ausência de Trilha Organizada",
    description:
      "Sem um roteiro estruturado passo a passo, o estudo torna-se caótico e desmotiva o estudante logo nas primeiras semanas.",
  },
  {
    icon: Activity,
    title: "Pouco Acompanhamento da Evolução",
    description:
      "Sem métricas claras do desempenho em questões anteriores, é difícil mapear os pontos fracos para direcionar revisões.",
  },
];
export function Problem() {
  return (
    <section
      id="problema"
      className="relative overflow-hidden border-b border-border bg-background py-24 text-foreground"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            <span>O Desafio Real</span>
          </div>

          <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
            Não basta estudar mais. <br className="hidden sm:inline" />
            <span className="text-primary italic">É preciso saber o que estudar.</span>
          </h2>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-base">
            Estudantes que desejam se destacar em Olimpíadas de Biologia enfrentam obstáculos
            diários de organização, tempo e direcionamento.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {problems.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <div className="group flex h-full flex-col justify-between rounded-3xl border border-primary/25 bg-background p-8 shadow-soft transition-all duration-300 hover:border-primary">
                <div className="space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/40 bg-surface text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="size-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold transition-colors group-hover:text-primary-glow">
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
