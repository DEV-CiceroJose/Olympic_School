import type { Conversation, Notebook } from "@/types/chat";

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

export const mockNotebooks: Notebook[] = [
  { id: "obb-geral", name: "OBB — Biologia Geral", description: "Conteúdo amplo para a OBB" },
  { id: "genetica", name: "Genética", description: "Mendel, biologia molecular e populações" },
  { id: "ecologia", name: "Ecologia", description: "Ecossistemas, ciclos e populações" },
  { id: "fisiologia", name: "Fisiologia Humana", description: "Sistemas e regulação" },
  { id: "botanica", name: "Botânica", description: "Morfologia e fisiologia vegetal" },
  { id: "zoologia", name: "Zoologia", description: "Filos, evolução e anatomia comparada" },
  { id: "simulados", name: "Simulados", description: "Provas anteriores e treinos" },
];

export const mockConversations: Conversation[] = [
  {
    id: "revisao-genetica",
    title: "Revisão de genética",
    updatedAt: iso(20),
    notebookId: "genetica",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Explique seleção natural no nível de uma olimpíada científica.",
        createdAt: iso(24),
        status: "completed",
      },
      {
        id: "m2",
        role: "assistant",
        createdAt: iso(23),
        status: "completed",
        content: `A **seleção natural** é um processo evolutivo em que indivíduos com características mais adequadas ao ambiente tendem a sobreviver e se reproduzir com maior frequência.

Para uma questão de olimpíada, observe sempre:

1. Qual característica está sendo favorecida;
2. Qual pressão ambiental está envolvida;
3. Se existe variação entre os indivíduos;
4. Se a característica é hereditária.

| Requisito | Por que importa |
| --- | --- |
| Variação | Sem diferenças não há o que selecionar |
| Herdabilidade | A característica precisa passar às gerações seguintes |
| Sucesso reprodutivo | É ele que muda as frequências alélicas |

> Dica: bancas costumam trocar "adaptação individual" por "adaptação populacional" — só populações evoluem.`,
      },
    ],
  },
  {
    id: "questoes-ecologia",
    title: "Questões sobre ecologia",
    updatedAt: iso(90),
    notebookId: "ecologia",
    messages: [],
  },
  {
    id: "resumo-fisiologia",
    title: "Resumo de fisiologia",
    updatedAt: iso(60 * 26),
    notebookId: "fisiologia",
    messages: [],
  },
  {
    id: "plano-obb",
    title: "Plano de estudos para OBB",
    updatedAt: iso(60 * 30),
    notebookId: "obb-geral",
    messages: [],
  },
  {
    id: "citologia-organelas",
    title: "Organelas e suas funções",
    updatedAt: iso(60 * 24 * 4),
    messages: [],
  },
  {
    id: "evolucao-filogenia",
    title: "Árvores filogenéticas",
    updatedAt: iso(60 * 24 * 6),
    messages: [],
  },
];

export const mockAssistantReplies: string[] = [
  `Vamos por partes.

### Ideia central
Esse tema costuma cair em olimpíadas conectado a **interpretação de dados**, não a memorização pura.

### Como estudar
1. Entenda o mecanismo antes da nomenclatura;
2. Refaça questões de provas anteriores;
3. Explique o conteúdo em voz alta com suas palavras;
4. Registre os erros em um caderno de revisão.

Quer que eu transforme isso em um plano de estudos de quatro semanas?`,
  `Boa pergunta — esse é um clássico de OBB.

- **Conceito:** o processo depende de variação hereditária dentro da população.
- **Armadilha comum:** confundir causa e consequência nos gráficos.
- **Como responder:** identifique a variável controlada, depois a resposta biológica.

Se quiser, gero 10 questões comentadas sobre isso.`,
  `Aqui vai um resumo objetivo:

| Tópico | O que memorizar | O que entender |
| --- | --- | --- |
| Estrutura | Nomes e partes | Relação forma-função |
| Processo | Etapas principais | Regulação e limites |
| Aplicação | Exemplos clássicos | Interpretação de experimentos |

Posso aprofundar qualquer linha da tabela.`,
];

export const mockUser = {
  name: "Estudante BiodoraIA",
  initials: "BI",
  plan: "Olimpíadas de Biologia",
};
