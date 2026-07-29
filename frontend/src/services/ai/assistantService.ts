import type { SendMessagePayload } from "@/types/chat";
import { streamBiodoraResponse } from "./firebaseAiLogic";

const MESSAGE_LIMIT_PER_SESSION = 60;
let sentMessages = 0;

function friendlyAiError(error: unknown): Error {
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

export const assistantService = {
  async *sendMessage(
    payload: SendMessagePayload,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<string, void, unknown> {
    if (sentMessages >= MESSAGE_LIMIT_PER_SESSION) {
      throw new Error("Limite de 60 mensagens por sessão atingido.");
    }
    sentMessages += 1;

    try {
      yield* streamBiodoraResponse(
        payload.message,
        payload.mode ?? "tutor",
        payload.attachments,
        options?.signal,
      );
    } catch (error) {
      throw friendlyAiError(error);
    }
  },
};
