import { createOlympicSchoolApi } from "./api.js";
import { missingFirebaseFields, normalizeRuntimeSettings } from "./config.js";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, className = "os-button") {
  const node = element("button", className, label);
  node.type = "button";
  return node;
}

function clear(root) {
  root.replaceChildren();
}

function friendlyError(error) {
  const code = error?.code ?? "";
  if (code.includes("popup-closed")) return "O login foi cancelado antes de concluir.";
  if (code.includes("popup-blocked")) return "O navegador bloqueou a janela de login.";
  if (code.includes("unauthorized-domain")) return "Este domínio ainda não foi autorizado no Firebase Authentication.";
  if (code.includes("permission-denied")) return "O Firebase recusou esta operação. Verifique as regras e o App Check.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

function renderNotice(root, title, message, link) {
  clear(root);
  const card = element("section", "os-card os-notice");
  card.append(element("h2", "os-title", title), element("p", "os-copy", message));
  if (link) {
    const anchor = element("a", "os-button", "Abrir configuração");
    anchor.href = link;
    card.append(anchor);
  }
  root.append(card);
}

function renderLogin(root, login) {
  clear(root);
  const layout = element("section", "os-login");
  const eyebrow = element("span", "os-eyebrow", "OLYMPIC SCHOOL");
  const title = element("h1", "os-display", "Sua preparação olímpica, em um só lugar.");
  const copy = element("p", "os-copy", "Entre com sua conta Google para acessar estudos e o assistente.");
  const error = element("p", "os-error");
  error.hidden = true;
  const loginButton = button("Entrar com Google", "os-button os-button-primary");
  loginButton.addEventListener("click", async () => {
    loginButton.disabled = true;
    loginButton.textContent = "Abrindo Google…";
    error.hidden = true;
    try {
      await login();
    } catch (cause) {
      error.textContent = friendlyError(cause);
      error.hidden = false;
      loginButton.disabled = false;
      loginButton.textContent = "Entrar com Google";
    }
  });
  layout.append(eyebrow, title, copy, loginButton, error);
  root.append(layout);
}

function renderProfile(root, user, profile, completeProfile, done) {
  clear(root);
  const card = element("section", "os-card os-profile");
  card.append(
    element("span", "os-eyebrow", "PRIMEIRO ACESSO"),
    element("h2", "os-title", "Complete seu perfil"),
    element("p", "os-copy", "Essas informações personalizam sua trilha de estudos."),
  );

  const form = element("form", "os-form");
  const nameLabel = element("label", "os-label", "Nome");
  const name = element("input", "os-input");
  name.name = "name";
  name.required = true;
  name.maxLength = 80;
  name.value = profile.name ?? user.displayName ?? "";
  nameLabel.append(name);

  const classLabel = element("label", "os-label", "Turma");
  const studentClass = element("input", "os-input");
  studentClass.name = "turma";
  studentClass.required = true;
  studentClass.maxLength = 80;
  studentClass.placeholder = "Ex.: 2º ano B";
  classLabel.append(studentClass);

  const error = element("p", "os-error");
  error.hidden = true;
  const submit = button("Salvar e continuar", "os-button os-button-primary");
  submit.type = "submit";
  form.append(nameLabel, classLabel, submit, error);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const next = await completeProfile({
        name: name.value.trim(),
        turma: studentClass.value.trim(),
      });
      done(next);
    } catch (cause) {
      error.textContent = friendlyError(cause);
      error.hidden = false;
      submit.disabled = false;
    }
  });
  card.append(form);
  root.append(card);
}

function renderDashboard(root, user, profile, logout) {
  clear(root);
  const shell = element("section", "os-shell");
  const header = element("header", "os-header");
  const brand = element("div", "os-brand", "Olympic School");
  const account = element("div", "os-account");
  account.append(element("span", "os-account-name", profile.name || user.displayName || "Estudante"));
  const logoutButton = button("Sair", "os-button os-button-secondary");
  logoutButton.addEventListener("click", logout);
  account.append(logoutButton);
  header.append(brand, account);

  const hero = element("div", "os-dashboard-hero");
  hero.append(
    element("span", "os-eyebrow", "ÁREA DO ESTUDANTE"),
    element("h1", "os-display os-display-small", `Olá, ${profile.name || "estudante"}.`),
    element("p", "os-copy", "O núcleo WordPress está conectado. Agora migraremos os módulos de estudo e o assistente."),
  );

  const grid = element("div", "os-grid");
  [
    ["Visão geral", "Base do painel pronta"],
    ["Diagnóstico", "Próxima migração"],
    ["Treino", "Próxima migração"],
    ["Progresso", "Próxima migração"],
    ["Plano", "Próxima migração"],
    ["Assistente", "Próxima migração"],
  ].forEach(([title, status]) => {
    const card = element("article", "os-card os-module");
    card.append(element("h2", "os-module-title", title), element("p", "os-muted", status));
    grid.append(card);
  });
  shell.append(header, hero, grid);
  root.append(shell);
}

async function mount(root) {
  const settings = normalizeRuntimeSettings(window.OlympicSchoolSettings);
  const missing = missingFirebaseFields(settings);
  if (missing.length) {
    renderNotice(
      root,
      "Configuração necessária",
      `Preencha os campos do Firebase antes de usar o aplicativo: ${missing.join(", ")}.`,
      settings.settingsUrl,
    );
    return;
  }

  const api = createOlympicSchoolApi(settings);
  window.OlympicSchool = api;
  window.dispatchEvent(new CustomEvent("olympic-school:ready", { detail: { api } }));

  api.auth.observe(async (user) => {
    window.dispatchEvent(new CustomEvent("olympic-school:auth-changed", { detail: { user } }));
    if (!user) {
      renderLogin(root, api.auth.signInWithGoogle);
      return;
    }
    try {
      const profile = await api.auth.ensureStudentProfile(user);
      if (!profile.profileCompleted) {
        renderProfile(root, user, profile, api.auth.completeStudentProfile, (next) =>
          renderDashboard(root, user, next, api.auth.signOut),
        );
        return;
      }
      renderDashboard(root, user, profile, api.auth.signOut);
    } catch (error) {
      renderNotice(root, "Não foi possível carregar seu perfil", friendlyError(error));
    }
  });
}

document.querySelectorAll("[data-olympic-school-app]").forEach((root) => {
  mount(root).catch((error) => {
    renderNotice(root, "Falha ao iniciar o Olympic School", friendlyError(error));
  });
});
