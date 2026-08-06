export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(label, className = "os-button") {
  const node = element("button", className, label);
  node.type = "button";
  return node;
}

export function clear(node) {
  node.replaceChildren();
}

export function pageHeader(eyebrow, title, copy) {
  const header = element("header", "os-page-header");
  header.append(element("span", "os-eyebrow", eyebrow), element("h1", "os-page-title", title));
  if (copy) header.append(element("p", "os-copy", copy));
  return header;
}

export function card(title, copy, className = "") {
  const node = element("article", `os-card ${className}`.trim());
  if (title) node.append(element("h2", "os-card-title", title));
  if (copy) node.append(element("p", "os-muted", copy));
  return node;
}

export function field(label, input) {
  const wrapper = element("label", "os-label", label);
  wrapper.append(input);
  return wrapper;
}

export function input(type = "text", className = "os-input") {
  const node = element("input", className);
  node.type = type;
  return node;
}

export function select(options = [], className = "os-input") {
  const node = element("select", className);
  options.forEach(({ value, label }) => {
    const option = element("option", "", label);
    option.value = value;
    node.append(option);
  });
  return node;
}

export function textarea(className = "os-input os-textarea") {
  return element("textarea", className);
}

export function status(message, kind = "muted") {
  return element("p", `os-status os-status-${kind}`, message);
}

export function loading(message = "Carregando…") {
  const node = element("div", "os-loading");
  node.append(element("span", "os-spinner"), element("p", "os-muted", message));
  return node;
}

export function emptyState(title, copy) {
  const node = card(title, copy, "os-empty");
  return node;
}

export function setBusy(control, busy, busyLabel, idleLabel) {
  control.disabled = busy;
  control.textContent = busy ? busyLabel : idleLabel;
}

export function friendlyError(error) {
  const code = `${error?.code ?? ""} ${error?.message ?? error ?? ""}`;
  if (/popup-closed/i.test(code)) return "O login foi cancelado antes de concluir.";
  if (/popup-blocked/i.test(code)) return "O navegador bloqueou a janela de login.";
  if (/unauthorized-domain/i.test(code)) return "Este domínio ainda não foi autorizado no Firebase Authentication.";
  if (/permission-denied/i.test(code)) return "Você não tem permissão para concluir esta operação.";
  if (/quota|429|resource-exhausted/i.test(code)) return "O limite temporário do serviço foi atingido. Aguarde alguns minutos.";
  if (/AUTH_REQUIRED/i.test(code)) return "Entre novamente para continuar.";
  if (/MESSAGE_TOO_LONG/i.test(code)) return "A mensagem ultrapassa o limite permitido.";
  return error?.message && !/firebase/i.test(error.message)
    ? error.message
    : "Não foi possível concluir a operação. Tente novamente.";
}

export function download(filename, content, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function safeId(prefix, value) {
  const slug = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${prefix}-${slug || crypto.randomUUID()}`;
}
