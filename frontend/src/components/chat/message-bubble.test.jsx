import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "./message-bubble";
describe("MessageBubble", () => {
  it("renderiza estrutura Markdown e fórmulas matemáticas", () => {
    const html = renderToStaticMarkup(
      createElement(MessageBubble, {
        message: {
          id: "message-1",
          role: "assistant",
          content: "## Enzimas\n\n1. Reduzem a energia $\\Delta G$.\n2. Não são consumidas.",
          createdAt: "2026-07-29T12:00:00.000Z",
          status: "completed",
          mode: "assistant",
        },
      }),
    );
    expect(html).toContain("<h2>Enzimas</h2>");
    expect(html).toContain("<ol>");
    expect(html).toContain('class="katex"');
    expect(html).not.toContain("$\\Delta G$");
  });
});
