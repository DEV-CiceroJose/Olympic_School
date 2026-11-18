import { Search } from "lucide-react";
import { EnterButton } from "./enter-button";

export function Hero() {
  return (
    <section id="topo" className="pdf-hero relative isolate overflow-hidden">
      <div className="pdf-hero-texture" aria-hidden="true" />
      <img src="/design/pdf-dna.png" className="pdf-hero-dna" alt="" aria-hidden="true" />
      <div className="pdf-hero-content mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <h1 className="pdf-hero-title">
          <span className="pdf-hero-intro">
            Estude para a Olimpíada
            <br />
            de Biologia com
          </span>
          <span className="pdf-hero-display">
            Inteligência
            <br />
            Artificial <span className="pdf-obb">OBB</span>
          </span>
        </h1>
        <p className="pdf-hero-description">
          A Olympic School está sendo construída para ajudar estudantes a organizar os estudos para
          a Olimpíada Brasileira de Biologia (OBB), entender o que priorizar e evoluir com materiais
          apoiados por IA.
        </p>
        <div className="pdf-hero-actions">
          <EnterButton label="ENTRAR NA OLYMPIC SCHOOL" size="lg" variant="hero" />
          <Search className="pdf-search-icon" aria-hidden="true" />
        </div>
        <p className="pdf-hero-note">Acesso com Google · cadastro automático no primeiro login</p>
      </div>
    </section>
  );
}
