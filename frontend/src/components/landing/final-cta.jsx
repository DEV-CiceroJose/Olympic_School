import { EnterButton } from "./enter-button";
import { Reveal } from "./reveal";
export function FinalCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="glass-panel bg-hero-glow relative overflow-hidden rounded-[2rem] px-6 py-16 text-center shadow-soft sm:px-12">
            <div
              className="bg-bio-grid pointer-events-none absolute inset-0 opacity-30"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
                Faça parte do início da <span className="text-gradient">Olympic School</span>
              </h2>
              <p className="mt-5 text-muted-foreground">
                Entre agora e acompanhe de perto cada etapa do desenvolvimento. Os primeiros
                estudantes ajudam a moldar a plataforma que estamos construindo.
              </p>
              <div className="mt-9 flex flex-col items-center gap-3">
                <EnterButton label="Entrar na Olympic School" size="lg" />
                <p className="text-xs text-muted-foreground">
                  Um único acesso. O cadastro acontece automaticamente no primeiro login.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
