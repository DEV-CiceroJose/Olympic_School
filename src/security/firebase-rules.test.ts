import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";

const projectId = "biodoraia-rules-test";
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore Security Rules", () => {
  it("permite que o estudante crie e leia o próprio perfil", async () => {
    const alice = testEnv.authenticatedContext("alice", { email: "alice@example.com" });
    const profile = doc(alice.firestore(), "users", "alice");
    await assertSucceeds(
      setDoc(profile, {
        uid: "alice",
        email: "alice@example.com",
        name: "Alice",
        avatarUrl: "",
        turma: "3º B",
        profileCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(getDoc(profile));
  });

  it("nega leitura de dados de outro estudante", async () => {
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(bob.firestore(), "users", "alice")));
  });

  it("isola conversas pelo uid autenticado", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const conversation = doc(alice.firestore(), "users", "alice", "conversations", "c1");
    await assertSucceeds(
      setDoc(conversation, {
        title: "Genética",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(getDoc(doc(bob.firestore(), "users", "alice", "conversations", "c1")));
  });

  it("impede alteração manual do domínio", async () => {
    const alice = testEnv.authenticatedContext("alice");
    await assertFails(
      setDoc(doc(alice.firestore(), "users", "alice", "skillMastery", "genetica"), {
        score: 100,
      }),
    );
  });
});

describe("Storage Security Rules", () => {
  it("aceita PDF válido somente no caminho do proprietário", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const file = ref(alice.storage(), "users/alice/uploads/file-1/material.pdf");
    await assertSucceeds(
      uploadString(file, "conteúdo", "raw", {
        contentType: "application/pdf",
      }),
    );
  });

  it("nega upload em caminho de outro usuário ou tipo não permitido", async () => {
    const bob = testEnv.authenticatedContext("bob");
    await assertFails(
      uploadString(
        ref(bob.storage(), "users/alice/uploads/file-2/material.pdf"),
        "conteúdo",
        "raw",
        { contentType: "application/pdf" },
      ),
    );
    await assertFails(
      uploadString(ref(bob.storage(), "users/bob/uploads/file-3/script.exe"), "conteúdo", "raw", {
        contentType: "application/octet-stream",
      }),
    );
  });

  it("nega acesso sem autenticação", async () => {
    const anonymous = testEnv.unauthenticatedContext();
    await expect(
      uploadString(
        ref(anonymous.storage(), "users/alice/uploads/file-4/material.txt"),
        "conteúdo",
        "raw",
        { contentType: "text/plain" },
      ),
    ).rejects.toBeTruthy();
  });
});
