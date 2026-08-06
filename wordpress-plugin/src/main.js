import { createOlympicSchoolApi } from "./api.js";
import { missingFirebaseFields, normalizeRuntimeSettings } from "./config.js";
import { renderAssistant } from "./ui/assistant.js";
import {
  renderArtifacts,
  renderDashboard,
  renderDiagnostic,
  renderNotebooks,
  renderPlans,
  renderProgress,
  renderTraining,
} from "./ui/learning.js";
import { renderTeacher } from "./ui/teacher.js";
import { button, clear, element, friendlyError, loading, status } from "./ui/dom.js";

const VIEWS = Object.freeze({
  dashboard: { label: "Visão geral", render: renderDashboard },
  diagnostic: { label: "Diagnóstico", render: renderDiagnostic },
  training: { label: "Treino", render: renderTraining },
  progress: { label: "Progresso", render: renderProgress },
  plans: { label: "Plano", render: renderPlans },
  notebooks: { label: "Notebooks", render: renderNotebooks },
  artifacts: { label: "Artefatos", render: renderArtifacts },
  assistant: { label: "Assistente", render: renderAssistant },
  teacher: { label: "Professor", render: renderTeacher },
});

function readRuntimeSettings(root) {
  const container = root.closest("[data-olympic-school-root]");
  const node = container?.querySelector("[data-olympic-school-settings]");
  if (!node?.textContent) return {};
  try {
    return JSON.parse(node.textContent);
  } catch {
    throw new Error("INVALID_WORDPRESS_SETTINGS");
  }
}

function renderNotice(root, title, message, link = "") {
  clear(root);
  const node = element("section", "os-card os-notice");
  node.append(element("h2", "os-title", title), element("p", "os-copy", message));
  if (link) {
    const anchor = element("a", "os-button os-button-secondary", "Abrir configurações");
    anchor.href = link;
    node.append(anchor);
  }
  root.append(node);
}

function renderLogin(root, login) {
  clear(root);
  const layout = element("section", "os-login");
  layout.append(
    element("span", "os-eyebrow", "OLYMPIC SCHOOL"),
    element("h1", "os-display", "Sua preparação olímpica, em um só lugar."),
    element("p", "os-copy", "Entre com sua conta Google para acessar estudos, progresso e o assistente."),
  );
  const error = status("", "error");
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
  layout.append(loginButton, error);
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
  name.required = true;
  name.maxLength = 80;
  name.value = profile.name ?? user.displayName ?? "";
  nameLabel.append(name);
  const classLabel = element("label", "os-label", "Turma");
  const studentClass = element("input", "os-input");
  studentClass.required = true;
  studentClass.maxLength = 80;
  studentClass.placeholder = "Ex.: 2º ano B";
  studentClass.value = profile.turma ?? "";
  classLabel.append(studentClass);
  const submit = button("Salvar e continuar", "os-button os-button-primary");
  submit.type = "submit";
  const error = status("", "error");
  error.hidden = true;
  form.append(nameLabel, classLabel, submit, error);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    try {
      done(await completeProfile({ name: name.value.trim(), turma: studentClass.value.trim() }));
    } catch (cause) {
      error.textContent = friendlyError(cause);
      error.hidden = false;
      submit.disabled = false;
    }
  });
  card.append(form);
  root.append(card);
}

function renderApplication(root, api, user, profile, claims = {}) {
  clear(root);
  const shell = element("section", "os-shell");
  const header = element("header", "os-header");
  const brand = button("Olympic School", "os-brand");
  const account = element("div", "os-account");
  account.append(element("span", "os-account-name", profile.name || user.displayName || "Estudante"));
  const logout = button("Sair", "os-button os-button-secondary");
  logout.addEventListener("click", () => void api.auth.signOut());
  account.append(logout);
  header.append(brand, account);
  const navigationEnabled = root.dataset.osNavigation !== "false";
  const nav = element("nav", "os-nav");
  nav.setAttribute("aria-label", "Área do estudante");
  const content = element("main", "os-content");
  const initial = Object.hasOwn(VIEWS, root.dataset.osView) ? root.dataset.osView : "dashboard";
  let currentView = initial;

  const context = {
    api,
    user,
    profile,
    navigate: (view) => activate(view),
  };

  const activate = (view) => {
    currentView = Object.hasOwn(VIEWS, view) ? view : "dashboard";
    [...nav.children].forEach((item) => item.classList.toggle("is-active", item.dataset.view === currentView));
    clear(content);
    content.append(loading(`Abrindo ${VIEWS[currentView].label.toLowerCase()}…`));
    Promise.resolve(VIEWS[currentView].render(content, context)).catch((error) => {
      clear(content);
      content.append(status(friendlyError(error), "error"));
    });
  };

  brand.addEventListener("click", () => activate("dashboard"));
  Object.entries(VIEWS).forEach(([view, config]) => {
    if (view === "teacher" && !api.domain.hasTeacherAccess(claims)) return;
    const control = button(config.label, "os-nav-item");
    control.dataset.view = view;
    control.addEventListener("click", () => activate(view));
    nav.append(control);
  });
  shell.append(header);
  if (navigationEnabled) shell.append(nav);
  shell.append(content);
  root.append(shell);
  activate(currentView);
}

async function mount(root) {
  const settings = normalizeRuntimeSettings(readRuntimeSettings(root));
  const missing = missingFirebaseFields(settings);
  if (missing.length) {
    renderNotice(root, "Configuração necessária", `Preencha os campos do Firebase: ${missing.join(", ")}.`, settings.settingsUrl);
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
      const claims = await api.auth.getClaims();
      if (!profile.profileCompleted) {
        renderProfile(root, user, profile, api.auth.completeStudentProfile, (next) => renderApplication(root, api, user, next, claims));
        return;
      }
      renderApplication(root, api, user, profile, claims);
    } catch (error) {
      renderNotice(root, "Não foi possível carregar seu perfil", friendlyError(error));
    }
  });
}

document.querySelectorAll("[data-olympic-school-app]").forEach((root) => {
  mount(root).catch((error) => renderNotice(root, "Falha ao iniciar o Olympic School", friendlyError(error)));
});
