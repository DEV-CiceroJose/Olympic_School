export const AI_FOCUS_PRESETS = Object.freeze({
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
      "Atue como tutor socrático. Explique em etapas curtas, use exemplos de Biologia e termine com uma pergunta de verificação e um próximo exercício.",
  },
  summary: {
    label: "Resumo",
    description: "Organiza conceitos, relações e revisão rápida.",
    instruction:
      "Gere um resumo com conceitos principais, relações, termos importantes, exemplos, erros comuns e perguntas de revisão.",
  },
  questions: {
    label: "Questões",
    description: "Cria prática objetiva e discursiva comentada.",
    instruction:
      "Gere questões objetivas e discursivas com tema, habilidade, dificuldade, gabarito e explicação. Separe as questões das respostas.",
  },
  flashcards: {
    label: "Flashcards",
    description: "Transforma o tema em cartões curtos de revisão.",
    instruction:
      "Gere flashcards curtos no formato Pergunta / Resposta, cobrindo definições, relações, aplicações e erros comuns.",
  },
  mindmap: {
    label: "Mapa mental",
    description: "Estrutura o tema em ramos e conexões.",
    instruction:
      "Crie um mapa mental hierárquico em Markdown, explicitando relações de causa, comparação e sequência.",
  },
  "study-plan": {
    label: "Plano de estudos",
    description: "Monta sessões, revisões e simulado.",
    instruction:
      "Crie um plano realista com objetivo, duração, sessões, exercícios, revisões espaçadas e simulado. Não invente desempenho.",
  },
  review: {
    label: "Correção discursiva",
    description: "Analisa raciocínio, erros e próximo passo.",
    instruction:
      "Corrija a resposta discursiva, identifique acertos e erros, explique a resposta adequada e recomende a próxima revisão.",
  },
});

export function normalizeAiFocus(mode) {
  return Object.hasOwn(AI_FOCUS_PRESETS, mode) ? mode : "assistant";
}

export function getAiFocusPreset(mode) {
  return AI_FOCUS_PRESETS[normalizeAiFocus(mode)];
}
