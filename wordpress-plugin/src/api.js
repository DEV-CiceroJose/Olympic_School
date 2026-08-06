import { initializeFirebase } from "./runtime/firebase.js";
import { authService } from "./services/auth.js";
import { conversationService } from "./services/conversations.js";
import { artifactRepository } from "./services/artifacts.js";
import { learningRepository } from "./services/learning.js";
import { studyPlanRepository } from "./services/study-plans.js";
import { fileService } from "./services/files.js";
import { assistantService } from "./services/assistant.js";
import { questionRepository } from "./services/questions.js";
import { notebookRepository } from "./services/notebooks.js";
import { promptPresetRepository } from "./services/prompts.js";
import { artifactDomain } from "./domain/artifacts.js";
import { learningDomain } from "./domain/learning.js";
import { studyPlanDomain } from "./domain/study-plan.js";
import { diagnosticQuestions } from "./data/diagnostic-questions.js";
import { externalNotebooks } from "./data/external-notebooks.js";
import { hasTeacherAccess } from "./domain/auth-claims.js";
import { AI_FOCUS_PRESETS } from "./domain/ai-focus-presets.js";

let api;

export function createOlympicSchoolApi(settings) {
  if (api) return api;
  initializeFirebase(settings);
  api = Object.freeze({
    version: "0.4.0",
    auth: authService,
    conversations: conversationService,
    artifacts: artifactRepository,
    learning: learningRepository,
    studyPlans: studyPlanRepository,
    files: fileService,
    assistant: assistantService,
    questions: questionRepository,
    notebooks: notebookRepository,
    prompts: promptPresetRepository,
    catalog: Object.freeze({ diagnosticQuestions, externalNotebooks }),
    domain: Object.freeze({
      artifacts: artifactDomain,
      learning: learningDomain,
      studyPlans: studyPlanDomain,
      hasTeacherAccess,
      aiFocusPresets: AI_FOCUS_PRESETS,
    }),
  });
  return api;
}
