const REQUIRED_FIREBASE_FIELDS = ["apiKey", "authDomain", "projectId", "appId"];

export function normalizeRuntimeSettings(runtime = {}) {
  const config = runtime.config ?? {};
  return {
    firebase: {
      apiKey: String(config.apiKey ?? "").trim(),
      authDomain: String(config.authDomain ?? "").trim(),
      projectId: String(config.projectId ?? "").trim(),
      storageBucket: String(config.storageBucket ?? "").trim(),
      messagingSenderId: String(config.messagingSenderId ?? "").trim(),
      appId: String(config.appId ?? "").trim(),
      measurementId: String(config.measurementId ?? "").trim(),
    },
    databaseId: String(config.databaseId ?? "biodoraia").trim() || "biodoraia",
    recaptchaSiteKey: String(config.recaptchaSiteKey ?? "").trim(),
    geminiModel: String(config.geminiModel ?? "gemini-3.6-flash").trim(),
    settingsUrl: String(runtime.settingsUrl ?? "").trim(),
  };
}

export function missingFirebaseFields(settings) {
  return REQUIRED_FIREBASE_FIELDS.filter((field) => !settings.firebase[field]);
}
