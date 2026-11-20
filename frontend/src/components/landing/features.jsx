import { Reveal } from "./reveal";
const features = [
  {
    id: "resumos",
    title: "Resumos Personalizados",
    description:
      "Sínteses inteligentes focadas em artigos científicos e no banco de questões históricas das Olimpíadas.",
  },
  {
    id: "mapas",
    title: "Mapas Mentais Visuais",
    description:
      "Diagramas estruturados para organizar reações metabólicas, sistemática e teias ecológicas.",
  },
  {
    id: "reds",
    title: "REDs",
    description:
      "Material sintetizado e formatado para leitura rápida no celular ou revisão presencial.",
  },
  {
    id: "questoes",
    title: "Questões de Biologia Comentadas",
    description: "Exercícios das edições passadas da OBB com resolução passo a passo.",
  },
  {
    id: "trilhas",
    title: "Trilhas de Estudo por Fase",
    description: "Cronograma estratégico ajustado de acordo com a data de cada prova olímpica.",
  },
  {
    id: "desempenho",
    title: "Análise de Desempenho Individual",
    description: "Relatórios demonstrando a taxa de acerto por grande área da biologia.",
  },
];
export function Features() {
  return (
    <section id="recursos" className="landing-section">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal className="pdf-section-header text-center">
          <h2>
            <img
              className="pdf-features-title mx-auto"
              src="/design/landing/titulo-recursos.webp"
              width="1770"
              height="134"
              alt="O que estamos construindo?"
            />
          </h2>
          <p className="pdf-section-description mx-auto">
            Conheça os recursos educacionais planejados para os próximos lançamentos da plataforma
            Olympic School.
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ id, title, description }, index) => (
            <Reveal key={id} delay={index * 50}>
              <article className="pdf-info-card">
                <h3 className="pdf-card-pill">{title}</h3>
                <p>{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
