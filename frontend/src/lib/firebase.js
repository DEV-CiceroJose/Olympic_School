import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);
// Firebase Auth validates the API-key shape as soon as the module is imported.
// A local, non-routable fallback keeps builds and unit tests independent from
// production configuration; the authentication service still rejects user-facing
// operations when the real VITE_* values are absent.
const testSafeFallbackConfig = {
  apiKey: `AIza${"A".repeat(35)}`,
  authDomain: "olympic-school-unconfigured.invalid",
  projectId: "olympic-school-unconfigured",
  appId: "1:0:web:unconfigured",
};
export const firebaseApp =
  getApps()[0] ?? initializeApp(isFirebaseConfigured ? firebaseConfig : testSafeFallbackConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(
  firebaseApp,
  import.meta.env.VITE_FIRESTORE_DATABASE_ID || "biodoraia",
);
let appCheck = null;
export function initializeOlympicSchoolAppCheck() {
  if (typeof window === "undefined" || appCheck) return appCheck;
  const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) return null;
  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheck;
}
