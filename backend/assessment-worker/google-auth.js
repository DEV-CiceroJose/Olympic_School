const signingKeysUrl =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const oauthUrl = "https://oauth2.googleapis.com/token";
const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let signingKeys;
let accessToken;

function fromBase64(value) {
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );
}

function toBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function jwtPart(value) {
  return toBase64Url(encoder.encode(JSON.stringify(value)));
}

export async function firebaseIdentity(request, projectId) {
  const authorization = request.headers.get("Authorization") ?? "";
  if (authorization.length > 8192 || !authorization.startsWith("Bearer ")) return null;
  const parts = authorization.slice(7).split(".");
  if (parts.length !== 3) return null;
  let header, claims, signature;
  try {
    header = JSON.parse(decoder.decode(fromBase64(parts[0])));
    claims = JSON.parse(decoder.decode(fromBase64(parts[1])));
    signature = fromBase64(parts[2]);
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (
    header?.alg !== "RS256" ||
    typeof header.kid !== "string" ||
    claims?.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof claims.sub !== "string" ||
    !claims.sub ||
    claims.sub.length > 128 ||
    claims.sub.includes("/") ||
    !Number.isInteger(claims.exp) ||
    claims.exp <= now ||
    !Number.isInteger(claims.iat) ||
    claims.iat > now ||
    !Number.isInteger(claims.auth_time) ||
    claims.auth_time > now
  )
    return null;

  if (!signingKeys || signingKeys.expiresAt <= now) {
    const response = await fetch(signingKeysUrl);
    if (!response.ok) throw new Error("Firebase public keys unavailable");
    const ttl = Number(response.headers.get("Cache-Control")?.match(/max-age=(\d+)/)?.[1] ?? 60);
    signingKeys = { expiresAt: now + ttl, keys: (await response.json()).keys };
  }
  const jwk = signingKeys.keys.find(({ kid }) => kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    algorithm,
    key,
    signature,
    encoder.encode(parts.slice(0, 2).join(".")),
  );
  return valid ? claims : null;
}

export async function firestoreAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (accessToken?.email === env.GOOGLE_CLIENT_EMAIL && accessToken.expiresAt > now + 60) {
    return accessToken.value;
  }
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Firestore service account secrets");
  }
  const pem = env.GOOGLE_PRIVATE_KEY.replaceAll("\\n", "\n");
  const pkcs8 = fromBase64(pem.replace(/-----[^-]+-----|\s/g, ""));
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, algorithm, false, ["sign"]);
  const unsigned = [
    jwtPart({ alg: "RS256", typ: "JWT" }),
    jwtPart({
      iss: env.GOOGLE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: oauthUrl,
      iat: now,
      exp: now + 3600,
    }),
  ].join(".");
  const signature = await crypto.subtle.sign(algorithm, key, encoder.encode(unsigned));
  const response = await fetch(oauthUrl, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${toBase64Url(new Uint8Array(signature))}`,
    }),
  });
  if (!response.ok) throw new Error("Firestore service account authentication failed");
  const result = await response.json();
  accessToken = {
    email: env.GOOGLE_CLIENT_EMAIL,
    value: result.access_token,
    expiresAt: now + result.expires_in,
  };
  return accessToken.value;
}
