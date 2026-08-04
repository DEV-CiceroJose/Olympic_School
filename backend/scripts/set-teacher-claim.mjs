import { execFileSync } from "node:child_process";

const PROJECT_ID = "biodoraia";
const API_ROOT = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`;

function accessToken() {
  const executable = process.platform === "win32" ? "gcloud.cmd" : "gcloud";
  try {
    return execFileSync(executable, ["auth", "application-default", "print-access-token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }).trim();
  } catch {
    throw new Error(
      "Não foi possível obter a credencial. Execute: gcloud auth application-default login",
    );
  }
}

async function identityRequest(method, body, token) {
  const response = await fetch(`${API_ROOT}:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Identity Platform respondeu HTTP ${response.status}.`);
  }
  return data;
}

const [email, requestedValue = "true"] = process.argv.slice(2);
if (!email || !["true", "false"].includes(requestedValue)) {
  console.error("Uso: npm run teacher:set-claim -- email@escola.com [true|false]");
  process.exitCode = 1;
} else {
  const token = accessToken();
  const lookup = await identityRequest("lookup", { email: [email] }, token);
  const user = lookup.users?.[0];
  if (!user) throw new Error(`Nenhuma conta encontrada para ${email}.`);
  const claims = user.customAttributes ? JSON.parse(user.customAttributes) : {};
  if (requestedValue === "true") claims.teacher = true;
  else delete claims.teacher;
  await identityRequest(
    "update",
    { localId: user.localId, customAttributes: JSON.stringify(claims) },
    token,
  );
  console.log(
    requestedValue === "true"
      ? `Acesso de professor concedido para ${email}.`
      : `Acesso de professor removido de ${email}.`,
  );
  console.log("A pessoa precisa sair e entrar novamente para atualizar o acesso.");
}
