import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { missingFirebaseFields, normalizeRuntimeSettings } from "./config.js";

describe("configuração do plugin", () => {
  it("usa os identificadores internos padrão", () => {
    const settings = normalizeRuntimeSettings();
    assert.equal(settings.databaseId, "biodoraia");
    assert.equal(settings.geminiModel, "gemini-3.6-flash");
  });

  it("informa os campos obrigatórios ausentes", () => {
    const settings = normalizeRuntimeSettings({
      config: { apiKey: "key", projectId: "project" },
    });
    assert.deepEqual(missingFirebaseFields(settings), ["authDomain", "appId"]);
  });
});
