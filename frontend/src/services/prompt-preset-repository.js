import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { AI_FOCUS_PRESETS, getAiFocusPreset, normalizeAiFocus } from "@/domain/ai-focus-presets";
import { db } from "@/lib/firebase";

const cache = new Map();

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

export const promptPresetRepository = {
  async get(mode) {
    const normalizedMode = normalizeAiFocus(mode);
    try {
      const snapshot = await getDoc(doc(db, "promptPresets", normalizedMode));
      const preset = mergePromptPreset(normalizedMode, snapshot.exists() ? snapshot.data() : null);
      cache.set(normalizedMode, preset);
      return preset;
    } catch {
      return mergePromptPreset(normalizedMode, null);
    }
  },
  async list() {
    let remote = new Map();
    try {
      const snapshot = await getDocs(collection(db, "promptPresets"));
      remote = new Map(snapshot.docs.map((item) => [item.id, item.data()]));
    } catch {
      // The built-in presets remain available if Firestore is temporarily offline.
    }
    return Object.keys(AI_FOCUS_PRESETS).map((mode) => {
      const preset = mergePromptPreset(mode, remote.get(mode));
      cache.set(mode, preset);
      return preset;
    });
  },
  async save(mode, input) {
    const normalizedMode = normalizeAiFocus(mode);
    if (normalizedMode !== mode) throw new Error("Foco de IA inválido.");
    const reference = doc(db, "promptPresets", normalizedMode);
    const existing = await getDoc(reference);
    const data = {
      mode: normalizedMode,
      description: input.description.trim(),
      instruction: input.instruction.trim(),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(reference, data);
    const preset = mergePromptPreset(normalizedMode, data);
    cache.set(normalizedMode, preset);
    return preset;
  },
};
