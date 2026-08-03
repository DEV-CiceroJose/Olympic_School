export const externalNotebooks = [
  {
    id: "notebooklm-home",
    title: "Biblioteca NotebookLM",
    description: "Acesse o NotebookLM. Os links específicos da equipe serão cadastrados aqui.",
    subject: "Biblioteca externa",
    url: "https://notebooklm.google.com/",
    isActive: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  },
  ...[
    "OBB — Biologia Geral",
    "Genética",
    "Ecologia",
    "Fisiologia Humana",
    "Botânica",
    "Zoologia",
    "Provas anteriores",
  ].map((title, index) => ({
    id: `pending-${index + 1}`,
    title,
    description: "Aguardando a equipe cadastrar o link externo específico.",
    subject: title.replace("OBB — ", ""),
    url: "",
    isActive: false,
    createdAt: "2026-07-29T00:00:00.000Z",
  })),
];
