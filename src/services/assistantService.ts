import { mockAssistantReplies } from "@/mocks/chat";
import type { SendMessagePayload } from "@/types/chat";
import { API_BASE_URL, USE_MOCKS, delay } from "./http";

/**
 * Camada abstrata. Com VITE_USE_MOCKS=true usa respostas simuladas.
 * Com false, consome a API externa em VITE_API_BASE_URL (backend separado).
 */
export const assistantService = {
  async *sendMessage(
    payload: SendMessagePayload,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<string, void, unknown> {
    if (!USE_MOCKS) {
      const response = await fetch(`${API_BASE_URL}/assistant/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: options?.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Falha ao enviar mensagem (${response.status}).`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
      return;
    }

    await delay(650);

    if (/\berro\b/i.test(payload.message)) {
      throw new Error("Não consegui gerar a resposta agora. Tente novamente.");
    }

    const index = Math.abs(payload.message.length) % mockAssistantReplies.length;
    const reply = mockAssistantReplies[index];
    const tokens = reply.match(/\s*\S+/g) ?? [reply];

    for (const token of tokens) {
      if (options?.signal?.aborted) return;
      await delay(22);
      yield token;
    }
  },
};
