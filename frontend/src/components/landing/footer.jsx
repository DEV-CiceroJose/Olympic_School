import { Github, Instagram, Linkedin } from "lucide-react";
import { Logo } from "./logo";
const institutional = [
  { label: "Sobre o projeto", href: "#topo" },
  { label: "Problema", href: "#problema" },
  { label: "Solução", href: "#solucao" },
  { label: "Recursos", href: "#recursos" },
];
const legal = [
  { label: "Privacidade", href: "#topo" },
  { label: "Termos de uso", href: "#topo" },
  { label: "Contato", href: "#topo" },
];
const socials = [
  { label: "Instagram", icon: Instagram },
  { label: "LinkedIn", icon: Linkedin },
  { label: "GitHub", icon: Github },
];
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Projeto educacional em desenvolvimento para estudantes de Olimpíadas Científicas de
              Biologia.
            </p>
            <ul className="mt-6 flex gap-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href="#topo"
                    aria-label={`${social.label} (em breve)`}
                    className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <social.icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
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

          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold">Legal</h2>
            <ul className="mt-4 space-y-3">
              {legal.map((item) => (
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

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Olympic School. Todos os direitos reservados.</p>
          <p>MVP em desenvolvimento · conteúdos e recursos ainda em construção.</p>
        </div>
      </div>
    </footer>
  );
}
