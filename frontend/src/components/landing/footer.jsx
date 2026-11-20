import { Logo } from "./logo";
const institutional = [
  { label: "Sobre o projeto", href: "#topo" },
  { label: "Problema", href: "#problema" },
  { label: "Solução", href: "#solucao" },
  { label: "Recursos", href: "#recursos" },
];
export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Projeto educacional em desenvolvimento para estudantes de Olimpíadas Científicas de
              Biologia.
            </p>
          </div>

          <nav aria-label="Institucional">
            <h2 className="text-sm font-semibold">Institucional</h2>
            <ul className="mt-4 space-y-3">
              {institutional.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Olympic School. Todos os direitos reservados.</p>
          <p>MVP em desenvolvimento · conteúdos e recursos ainda em construção.</p>
        </div>
      </div>
    </footer>
  );
}
