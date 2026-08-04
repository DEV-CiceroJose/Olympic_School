import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { diagnosticQuestions } from "@/data/diagnostic-questions";
import { db } from "@/lib/firebase";

function normalizeQuestion(id, data) {
  return {
    id,
    area: data.area,
    skillId: data.skillId,
    skillLabel: data.skillLabel,
    prompt: data.prompt,
    options: data.options,
    correctOption: data.correctOption,
    explanation: data.explanation,
    difficulty: data.difficulty,
    isActive: data.isActive !== false,
    source: data.source ?? "teacher",
  };
}

function validateQuestion(question) {
  const required = [
    question.area,
    question.skillId,
    question.skillLabel,
    question.prompt,
    question.explanation,
  ];
  if (required.some((value) => !value?.trim())) {
    throw new Error("Preencha todos os campos obrigatórios da questão.");
  }
  const options = question.options.map((option) => option.trim()).filter(Boolean);
  if (options.length < 2 || options.length > 6) {
    throw new Error("Informe entre 2 e 6 alternativas.");
  }
  if (question.correctOption < 0 || question.correctOption >= options.length) {
    throw new Error("Escolha uma alternativa correta válida.");
  }
  if (![1, 2, 3].includes(Number(question.difficulty))) {
    throw new Error("Escolha uma dificuldade entre 1 e 3.");
  }
  return { ...question, options };
}

async function remoteQuestions() {
  const snapshot = await getDocs(collection(db, "questions"));
  return snapshot.docs.map((item) => normalizeQuestion(item.id, item.data()));
}

export function mergeQuestionCatalog(remote = [], includeInactive = false) {
  const catalog = new Map(
    diagnosticQuestions.map((question) => [
      question.id,
      normalizeQuestion(question.id, { ...question, isActive: true, source: "default" }),
    ]),
  );
  for (const question of remote) catalog.set(question.id, question);
  return [...catalog.values()].filter((question) => includeInactive || question.isActive);
}

export const questionRepository = {
  async list({ includeInactive = false } = {}) {
    try {
      return mergeQuestionCatalog(await remoteQuestions(), includeInactive);
    } catch {
      return mergeQuestionCatalog([], includeInactive);
    }
  },
  async save(input) {
    const question = validateQuestion(input);
    const reference = doc(db, "questions", question.id);
    const existing = await getDoc(reference);
    const data = {
      area: question.area.trim(),
      skillId: question.skillId.trim(),
      skillLabel: question.skillLabel.trim(),
      prompt: question.prompt.trim(),
      options: question.options,
      correctOption: Number(question.correctOption),
      explanation: question.explanation.trim(),
      difficulty: Number(question.difficulty),
      isActive: question.isActive !== false,
      source: "teacher",
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(reference, data);
    return normalizeQuestion(question.id, data);
  },
  async remove(id) {
    await deleteDoc(doc(db, "questions", id));
  },
};
