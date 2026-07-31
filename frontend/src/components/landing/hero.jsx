import { Sparkles } from "lucide-react";
import { EnterButton } from "./enter-button";
import { Reveal } from "./reveal";
import heroImage from "@/assets/hero-bio-ai.jpg";
export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
      <div className="bg-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="bg-bio-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary-glow">
              <Sparkles className="size-3.5" aria-hidden="true" />
              MVP em desenvolvimento
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-balance font-display text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl">
              Estude para as Olimpíadas de Biologia com{" "}
              <span className="text-gradient">inteligência artificial</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A Olympic School está sendo construída para ajudar estudantes de OBB, OBBS, TNBIO e
              outras olimpíadas científicas a organizar os estudos, entender o que priorizar e
              evoluir com materiais apoiados por IA.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <EnterButton label="Entrar na Olympic School" size="lg" />
              <p className="text-xs text-muted-foreground">
                Acesso com Google · cadastro automático no primeiro login
              </p>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6">
              {[
                { k: "Foco", v: "Olimpíadas de Biologia" },
                { k: "Base", v: "Trilhas + IA" },
                { k: "Status", v: "Em construção" },
              ].map((item) => (
                <div key={item.k} className="min-w-0">
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{item.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative">
          <div className="glass-panel relative overflow-hidden rounded-3xl p-2 shadow-soft">
            <img
              src={heroImage}
              width={1200}
              height={1200}
              alt="Folha se transformando em uma hélice de DNA formada por nós de rede neural, representando biologia e inteligência artificial"
              className="h-full w-full rounded-2xl object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          </div>
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
        </Reveal>
      </div>
    </section>
  );
}
