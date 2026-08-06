import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { AI_FOCUS_PRESETS, getAiFocusPreset, normalizeAiFocus } from "../domain/ai-focus-presets.js";
import { getFirebaseRuntime } from "../runtime/firebase.js";

export function mergePromptPreset(mode, remote) {
  const normalizedMode = normalizeAiFocus(mode);
  const fallback = getAiFocusPreset(normalizedMode);
  return {
    mode: normalizedMode,
    label: fallback.label,
    description: remote?.description?.trim() || fallback.description,
    instruction: remote?.instruction?.trim() || fallback.instruction,
    customized: Boolean(remote?.instruction?.trim()),
  };
}

export const promptPresetRepository = Object.freeze({
  async get(mode) {
    const normalizedMode = normalizeAiFocus(mode);
    try {
      const snapshot = await getDoc(doc(getFirebaseRuntime().db, "promptPresets", normalizedMode));
      return mergePromptPreset(normalizedMode, snapshot.exists() ? snapshot.data() : null);
    } catch {
      return mergePromptPreset(normalizedMode, null);
    }
  },
  async list() {
    let remote = new Map();
    try {
      const snapshot = await getDocs(collection(getFirebaseRuntime().db, "promptPresets"));
      remote = new Map(snapshot.docs.map((item) => [item.id, item.data()]));
    } catch {
      // Os presets internos permanecem disponíveis quando o Firestore estiver offline.
    }
    return Object.keys(AI_FOCUS_PRESETS).map((mode) => mergePromptPreset(mode, remote.get(mode)));
  },
  async save(mode, input) {
    const normalizedMode = normalizeAiFocus(mode);
    if (normalizedMode !== mode) throw new Error("Foco de IA inválido.");
    if (String(input.instruction ?? "").trim().length < 50) {
      throw new Error("O prompt precisa ter pelo menos 50 caracteres.");
    }
    const { db } = getFirebaseRuntime();
    const reference = doc(db, "promptPresets", normalizedMode);
    const existing = await getDoc(reference);
    const data = {
      mode: normalizedMode,
      description: String(input.description ?? "").trim(),
      instruction: input.instruction.trim(),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(reference, data);
    return mergePromptPreset(normalizedMode, data);
  },
});
