import { Activity, Compass, FileQuestion, Layers } from "lucide-react";
import { Reveal } from "./reveal";
const problems = [
  {
    icon: FileQuestion,
    title: "Conteúdos dispersos",
    description:
      "A matéria de olimpíadas está espalhada em apostilas antigas, sites variados e livros universitários extensos e sem direcionamento.",
  },
  {
    icon: Compass,
    title: "Falta de direcionamento",
    description:
      "Dificuldade para identificar quais tópicos de Botânica, Genética, Ecologia e Fisiologia têm maior incidência nas provas.",
  },
  {
    icon: Layers,
    title: "Ausência de trilha organizada",
    description:
      "Sem um roteiro estruturado passo a passo, o estudo torna-se caótico e desmotiva o estudante logo nas primeiras semanas.",
  },
  {
    icon: Activity,
    title: "Pouco acompanhamento da evolução",
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
        <Reveal className="mb-12 max-w-5xl space-y-4">
          <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
            Não basta <span className="text-primary">estudar mais</span>
            <br />É preciso saber <span className="text-primary">O QUE ESTUDAR</span>
          </h2>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Estudantes que desejam se destacar em Olimpíadas de Biologia enfrentam obstáculos
            diários de organização, tempo e direcionamento.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {problems.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <div className="pdf-info-card group flex h-full flex-col justify-between rounded-3xl border border-primary/25 p-7 shadow-soft transition-all duration-300 hover:border-primary">
                <div className="space-y-4">
                  <div className="pdf-card-icon flex size-12 items-center justify-center rounded-2xl border border-primary/40 bg-surface text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="size-6" aria-hidden="true" />
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
