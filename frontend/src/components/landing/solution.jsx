import { BrainCircuit, Route, TrendingUp } from "lucide-react";
import { Reveal } from "./reveal";
const solutions = [
  {
    icon: Route,
    title: "Trilhas organizadas",
    text: "Um caminho claro por tema e nível, do básico ao avançado, seguindo a lógica das provas olímpicas.",
  },
  {
    icon: BrainCircuit,
    title: "Materiais apoiados por IA",
    text: "Resumos, mapas mentais e questões gerados e revisados com apoio de inteligência artificial.",
  },
  {
    icon: TrendingUp,
    title: "Evolução personalizada",
    text: "Acompanhamento do desempenho para indicar o próximo passo certo para cada estudante.",
  },
];
export function Solution() {
  return (
    <section id="solucao" className="relative py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-64 max-w-3xl rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            A solução
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">
            A visão que estamos construindo
          </h2>
          <p className="mt-4 text-muted-foreground">
            Estes três pilares fazem parte da visão do projeto Olympic School. Ainda estão em
            desenvolvimento e serão liberados por etapas.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {solutions.map((item, i) => (
            <Reveal key={item.title} delay={i * 90}>
              <article className="glass-panel group relative h-full overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <span
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-0"
                  aria-hidden="true"
                />
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <item.icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                <p className="mt-6 inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  Parte da visão do projeto
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
