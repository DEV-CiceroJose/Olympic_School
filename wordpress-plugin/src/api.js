import { initializeFirebase } from "./runtime/firebase.js";
import { authService } from "./services/auth.js";
import { conversationService } from "./services/conversations.js";
import { artifactRepository } from "./services/artifacts.js";
import { learningRepository } from "./services/learning.js";
import { studyPlanRepository } from "./services/study-plans.js";
import { fileService } from "./services/files.js";
import { assistantService } from "./services/assistant.js";
import { artifactDomain } from "./domain/artifacts.js";
import { learningDomain } from "./domain/learning.js";
import { studyPlanDomain } from "./domain/study-plan.js";
import { diagnosticQuestions } from "./data/diagnostic-questions.js";
import { externalNotebooks } from "./data/external-notebooks.js";

let api;

export function createOlympicSchoolApi(settings) {
  if (api) return api;
  initializeFirebase(settings);
  api = Object.freeze({
    version: "0.2.0",
    auth: authService,
    conversations: conversationService,
    artifacts: artifactRepository,
    learning: learningRepository,
    studyPlans: studyPlanRepository,
    files: fileService,
    assistant: assistantService,
    catalog: Object.freeze({ diagnosticQuestions, externalNotebooks }),
    domain: Object.freeze({
      artifacts: artifactDomain,
      learning: learningDomain,
      studyPlans: studyPlanDomain,
    }),
  });
  return api;
}
