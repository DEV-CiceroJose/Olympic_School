export const AI_FOCUS_PRESETS = {
  assistant: {
    label: "Assistente",
    description: "Resposta direta e organizada para dúvidas gerais.",
    instruction:
      "Responda de forma direta, organizada e útil. Adapte a profundidade ao pedido sem transformar toda resposta em uma aula guiada.",
  },
  tutor: {
    label: "Tutor guiado",
    description: "Explica por etapas e verifica o entendimento.",
    instruction:
      "Atue como tutor socrático. Descubra o nível do estudante pelo contexto, explique em etapas curtas, use exemplos de Biologia e termine com uma pergunta de verificação e um próximo exercício. Não entregue apenas a resposta final quando houver valor pedagógico em guiar o raciocínio.",
  },
  summary: {
    label: "Resumo",
    description: "Organiza conceitos, relações e revisão rápida.",
    instruction:
      "Gere um resumo com conceitos principais, relações entre conceitos, termos importantes, exemplos, erros comuns e perguntas de revisão. Use títulos claros e priorize o que mais cai em olimpíadas científicas.",
  },
  questions: {
    label: "Questões",
    description: "Cria prática objetiva e discursiva comentada.",
    instruction:
      "Gere questões objetivas e discursivas com tema, habilidade avaliada, dificuldade progressiva, gabarito e explicação sem ambiguidades. Separe as questões das respostas para permitir que o estudante tente primeiro.",
  },
  flashcards: {
    label: "Flashcards",
    description: "Transforma o tema em cartões curtos de revisão.",
    instruction:
      "Gere flashcards curtos no formato Pergunta / Resposta. Cubra definições, relações, aplicações e erros comuns, evitando cartões redundantes ou respostas longas.",
  },
  mindmap: {
    label: "Mapa mental",
    description: "Estrutura o tema em ramos e conexões.",
    instruction:
      "Crie um mapa mental hierárquico em Markdown. Comece pelo tema central, organize ramos e sub-ramos, explicite relações de causa, comparação ou sequência e destaque conexões que costumam aparecer em olimpíadas de Biologia.",
  },
  "study-plan": {
    label: "Plano de estudos",
    description: "Monta sessões, revisões e simulado.",
    instruction:
      "Crie um plano realista com objetivo, duração, sessões, exercícios, revisões espaçadas e simulado. Use apenas informações fornecidas pelo estudante e não invente desempenho; quando faltar um dado essencial, declare a suposição adotada.",
  },
  review: {
    label: "Correção discursiva",
    description: "Analisa raciocínio, erros e próximo passo.",
    instruction:
      "Corrija a resposta discursiva do estudante. Identifique acertos, erros conceituais, erros de interpretação, erros de cálculo ou raciocínio incompleto; explique a resposta adequada e recomende uma revisão ou exercício seguinte. Informe claramente que a avaliação é assistida por IA.",
  },
};

export function normalizeAiFocus(mode) {
  return mode in AI_FOCUS_PRESETS ? mode : "assistant";
}

export function getAiFocusPreset(mode) {
  return AI_FOCUS_PRESETS[normalizeAiFocus(mode)];
}
