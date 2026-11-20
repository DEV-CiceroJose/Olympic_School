import { EnterButton } from "./enter-button";

export function Hero() {
  return (
    <section id="topo" className="pdf-hero">
      <div className="pdf-hero-content mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <h1 className="pdf-hero-title">
          <span className="pdf-hero-intro">
            Estude para a Olimpíada
            <br />
            de Biologia com
          </span>
          <span className="pdf-hero-display">
            <img
              src="/design/landing/titulo-inicio.webp"
              width="1094"
              height="310"
              alt="Inteligência Artificial"
              fetchPriority="high"
            />
            <span className="pdf-obb" aria-hidden="true">
              OBB
            </span>
          </span>
        </h1>
        <p className="pdf-hero-description">
          A Olympic School está sendo construída para ajudar estudantes a organizar os estudos para
          a Olimpíada Brasileira de Biologia (OBB), entender o que priorizar e evoluir com materiais
          apoiados por IA.
        </p>
        <div className="pdf-hero-actions">
          <EnterButton label="ENTRAR NA OLYMPIC SCHOOL" size="lg" variant="hero" />
          <img
            src="/design/landing/lupa-inicio.webp"
            width="138"
            height="136"
            alt=""
            className="pdf-search-icon"
          />
        </div>
        <p className="pdf-hero-note">Acesso com Google · cadastro automático no primeiro login</p>
      </div>
    </section>
  );
}
