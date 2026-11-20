import { Reveal } from "./reveal";

const solutions = [
  {
    title: "Trilhas organizadas",
    text: "Um caminho claro por tema e nível, do básico ao avançado, seguindo a lógica das provas olímpicas.",
  },
  {
    title: "Materiais apoiados por IA",
    text: "Resumos, mapas mentais e questões gerados e revisados com apoio de inteligência artificial.",
  },
  {
    title: "Evolução personalizada",
    text: "Acompanhamento do desempenho para indicar o próximo passo certo para cada estudante.",
  },
];

export function Solution() {
  return (
    <section id="solucao" className="landing-section">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <Reveal className="pdf-section-header">
          <h2>
            <img
              className="pdf-solution-title"
              src="/design/landing/titulo-solucao.webp"
              width="1290"
              height="252"
              alt="A visão que estamos construindo"
            />
          </h2>
          <p className="pdf-section-description">
            Estes três pilares fazem parte da visão do projeto Olympic School. Ainda estão em
            desenvolvimento e serão liberados por etapas.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {solutions.map(({ title, text }, index) => (
            <Reveal key={title} delay={index * 70}>
              <article className="pdf-info-card">
                <h3 className="pdf-card-pill">{title}</h3>
                <p>{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
