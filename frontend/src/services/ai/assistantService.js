import { reviewDiscursiveAnswer, streamOlympicSchoolResponse } from "./firebaseAiLogic";
import { promptPresetRepository } from "@/services/prompt-preset-repository";
const MESSAGE_LIMIT_PER_SESSION = 60;
let sentMessages = 0;
function friendlyAiError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("MESSAGE_TOO_LONG")) {
    return new Error("A mensagem é muito longa. Reduza o texto e tente novamente.");
  }
  if (/quota|429|resource-exhausted/i.test(message)) {
    return new Error("O limite temporário da IA foi atingido. Aguarde alguns minutos.");
  }
  if (/app.check|app-check/i.test(message)) {
    return new Error("A verificação de segurança da IA falhou. Recarregue a página.");
  }
  return new Error("A IA não conseguiu responder agora. Tente novamente em instantes.");
}

function formatDiscursiveReview(review) {
  const errorLabels = {
    none: "Nenhum erro relevante",
    conceptual: "Erro conceitual",
    interpretation: "Erro de interpretação",
    calculation: "Erro de cálculo",
    incomplete_reasoning: "Raciocínio incompleto",
  };
  const percentage = Math.round(review.score * 100);
  const strengths = review.strengths.length
    ? review.strengths.map((item) => `- ${item}`).join("\n")
    : "- Nenhum ponto forte específico foi identificado.";
  const mistakes = review.mistakes.length
    ? review.mistakes.map((item) => `- ${item}`).join("\n")
    : "- Nenhum erro específico foi identificado.";
  return `## Correção discursiva assistida por IA

**Resultado:** ${review.isCorrect ? "Correta" : "Precisa de revisão"} · **Pontuação estimada:** ${percentage}% · **Classificação:** ${errorLabels[review.errorType] ?? review.errorType}

### Pontos fortes

${strengths}

### O que melhorar

${mistakes}

### Explicação

${review.explanation}

### Próximo passo

${review.recommendation}

> Esta correção foi gerada por IA e deve ser usada como apoio ao estudo.`;
}
export const assistantService = {
  async *sendMessage(payload, options) {
    if (sentMessages >= MESSAGE_LIMIT_PER_SESSION) {
      throw new Error("Limite de 60 mensagens por sessão atingido.");
    }
    sentMessages += 1;
    try {
      const mode = payload.mode ?? "assistant";
      const focus = await promptPresetRepository.get(mode);
      if (payload.mode === "review") {
        const review = await reviewDiscursiveAnswer(payload.message, payload.attachments, focus);
        yield formatDiscursiveReview(review);
        return;
      }
      yield* streamOlympicSchoolResponse(
        payload.message,
        mode,
        payload.attachments,
        options?.signal,
        focus,
      );
    } catch (error) {
      throw friendlyAiError(error);
    }
  },
};
