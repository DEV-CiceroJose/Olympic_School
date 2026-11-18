import {
  AssessmentError,
  finalizeAssessment,
  finalizeExpiredAssessments,
  startAssessment,
  submitAssessmentAnswer,
} from "./assessments.js";
import { createFirestore } from "./firestore.js";
import { firebaseIdentity, firestoreAccessToken } from "./google-auth.js";

const operations = new Map([
  ["/start", startAssessment],
  ["/answer", submitAssessmentAnswer],
  ["/finalize", finalizeAssessment],
]);
const statusCodes = {
  unauthenticated: 401,
  "permission-denied": 403,
  "invalid-argument": 400,
  "failed-precondition": 409,
  "already-exists": 409,
  aborted: 409,
};

async function firestore(env) {
  return createFirestore({
    projectId: env.FIREBASE_PROJECT_ID,
    databaseId: env.FIRESTORE_DATABASE_ID,
    token: await firestoreAccessToken(env),
  });
}

async function requestBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new AssessmentError("invalid-argument", "Dados da avaliação ausentes.");
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 4096) {
      await reader.cancel();
      throw new AssessmentError("invalid-argument", "Dados da avaliação acima do limite.");
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    const data = JSON.parse(text + decoder.decode());
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
  } catch {
    // Invalid JSON.
  }
  throw new AssessmentError("invalid-argument", "Dados da avaliação inválidos.");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const headers = { "Cache-Control": "no-store", Vary: "Origin" };
    if (origin) {
      const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim());
      if (!allowed.includes(origin)) return new Response(null, { status: 403, headers });
      headers["Access-Control-Allow-Origin"] = origin;
    }
    if (request.method === "OPTIONS") {
      headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
      return new Response(null, { status: 204, headers });
    }

    const operation = operations.get(new URL(request.url).pathname);
    if (!operation || request.method !== "POST")
      return new Response(null, { status: 404, headers });
    try {
      const identity = await firebaseIdentity(request, env.FIREBASE_PROJECT_ID);
      if (!identity) throw new AssessmentError("unauthenticated", "Faça login novamente.");
      const input = await requestBody(request);
      const data = await operation(await firestore(env), identity, input);
      return Response.json({ data }, { headers });
    } catch (error) {
      if (error instanceof AssessmentError) {
        return Response.json(
          { error: { code: error.code, message: error.message } },
          {
            status: statusCodes[error.code],
            headers,
          },
        );
      }
      console.error(error.message);
      return Response.json(
        {
          error: { code: "unavailable", message: "O serviço de diagnóstico está indisponível." },
        },
        { status: 503, headers },
      );
    }
  },

  async scheduled(_event, env) {
    await finalizeExpiredAssessments(await firestore(env));
  },
};
