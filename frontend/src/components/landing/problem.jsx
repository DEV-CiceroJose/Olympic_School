import { Reveal } from "./reveal";

const problems = [
  {
    icon: "lupa-problema",
    title: "Conteúdos dispersos",
    description:
      "A matéria de olimpíadas está espalhada em apostilas antigas, sites variados e livros universitários extensos e sem direcionamento.",
  },
  {
    title: "Falta de direcionamento",
    description:
      "Dificuldade para identificar quais tópicos de Botânica, Genética, Ecologia e Fisiologia têm maior incidência nas provas.",
  },
  {
    icon: "prancheta",
    title: "Ausência de trilha organizada",
    description:
      "Sem um roteiro estruturado passo a passo, o estudo torna-se caótico e desmotiva o estudante logo nas primeiras semanas.",
  },
  {
    icon: "evolucao",
    title: "Pouco acompanhamento da evolução",
    description:
      "Sem métricas claras do desempenho em questões anteriores, é difícil mapear os pontos fracos para direcionar revisões.",
  },
];

export function Problem() {
  return (
    <section id="problema" className="landing-section">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <Reveal className="pdf-problem-heading">
          <h2>
            <span>
              Não basta <strong>estudar mais</strong>
            </span>
            <span className="pdf-problem-lead">É preciso saber</span>
            <img
              className="pdf-problem-title"
              src="/design/landing/titulo-problema.webp"
              width="1138"
              height="144"
              alt="O QUE ESTUDAR"
            />
          </h2>
          <img
            src="/design/landing/lampada.webp"
            width="236"
            height="334"
            alt=""
            className="pdf-problem-lamp"
          />
          <p className="pdf-section-description">
            Estudantes que desejam se destacar em Olimpíadas de Biologia enfrentam obstáculos
            diários de organização, tempo e direcionamento.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-x-8">
          {problems.map(({ title, description, icon }, index) => (
            <Reveal key={title} delay={index * 60}>
              <article className="pdf-info-card pdf-problem-card" data-icon={icon}>
                <h3 className="pdf-card-pill">{title}</h3>
                <p>{description}</p>
                {icon && (
                  <img src={`/design/landing/${icon}.webp`} alt="" className="pdf-problem-icon" />
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
