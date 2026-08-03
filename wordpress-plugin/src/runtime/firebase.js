import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-check.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const APP_NAME = "olympic-school-wordpress";
let runtime;

export function initializeFirebase(settings) {
  if (runtime) return runtime;

  const existing = getApps().find((candidate) => candidate.name === APP_NAME);
  const app = existing ? getApp(APP_NAME) : initializeApp(settings.firebase, APP_NAME);

  if (settings.recaptchaSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(settings.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  runtime = {
    app,
    auth: getAuth(app),
    db: getFirestore(app, settings.databaseId),
    geminiModel: settings.geminiModel,
  };
  return runtime;
}

export function getFirebaseRuntime() {
  if (!runtime) throw new Error("FIREBASE_NOT_INITIALIZED");
  return runtime;
}
