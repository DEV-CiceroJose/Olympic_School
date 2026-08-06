import {
  button,
  card,
  clear,
  field,
  friendlyError,
  input,
  loading,
  pageHeader,
  safeId,
  select,
  status,
  textarea,
} from "./dom.js";

function checkbox(label, checked = true) {
  const wrapper = document.createElement("label");
  wrapper.className = "os-check";
  const control = input("checkbox");
  control.checked = checked;
  wrapper.append(control, document.createTextNode(label));
  return { wrapper, control };
}

function managerLayout(formCard, listCard) {
  const layout = document.createElement("div");
  layout.className = "os-manager-layout";
  layout.append(formCard, listCard);
  return layout;
}

async function renderQuestionManager(container, context) {
  clear(container);
  container.append(loading("Carregando questões…"));
  let questions = await context.api.questions.list({ includeInactive: true });
  let editing = null;
  const draw = () => {
    clear(container);
    const formCard = card(editing ? "Editar questão" : "Nova questão", "", "os-manager-form");
    const form = document.createElement("form");
    form.className = "os-form";
    const area = input();
    const skillLabel = input();
    const skillId = input();
    const prompt = textarea();
    prompt.rows = 4;
    const options = textarea();
    options.rows = 6;
    const correctOption = select(Array.from({ length: 6 }, (_, index) => ({ value: `${index}`, label: `${String.fromCharCode(65 + index)} — alternativa ${index + 1}` })));
    const difficulty = select([{ value: "1", label: "1 — Introdutória" }, { value: "2", label: "2 — Intermediária" }, { value: "3", label: "3 — Avançada" }]);
    const explanation = textarea();
    explanation.rows = 4;
    const active = checkbox("Questão ativa para os alunos", editing?.isActive !== false);
    if (editing) {
      area.value = editing.area;
      skillLabel.value = editing.skillLabel;
      skillId.value = editing.skillId;
      prompt.value = editing.prompt;
      options.value = editing.options.join("\n");
      correctOption.value = `${editing.correctOption}`;
      difficulty.value = `${editing.difficulty}`;
      explanation.value = editing.explanation;
    }
    form.append(
      field("Área", area),
      field("Nome da habilidade", skillLabel),
      field("Identificador da habilidade", skillId),
      field("Enunciado", prompt),
      field("Alternativas — uma por linha", options),
      field("Alternativa correta", correctOption),
      field("Dificuldade", difficulty),
      field("Explicação do gabarito", explanation),
      active.wrapper,
    );
    [area, skillLabel, skillId, prompt, options, explanation].forEach((control) => { control.required = true; });
    const actions = document.createElement("div");
    actions.className = "os-actions";
    const save = button("Salvar questão", "os-button os-button-primary");
    save.type = "submit";
    actions.append(save);
    if (editing) {
      const cancel = button("Cancelar", "os-button os-button-secondary");
      cancel.addEventListener("click", () => { editing = null; draw(); });
      actions.append(cancel);
    }
    const error = status("", "error");
    error.hidden = true;
    form.append(actions, error);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      save.disabled = true;
      try {
        await context.api.questions.save({
          id: editing?.id || safeId("question", prompt.value),
          area: area.value,
          skillLabel: skillLabel.value,
          skillId: skillId.value,
          prompt: prompt.value,
          options: options.value.split("\n"),
          correctOption: Number(correctOption.value),
          difficulty: Number(difficulty.value),
          explanation: explanation.value,
          isActive: active.control.checked,
        });
        questions = await context.api.questions.list({ includeInactive: true });
        editing = null;
        draw();
      } catch (cause) {
        error.textContent = friendlyError(cause);
        error.hidden = false;
        save.disabled = false;
      }
    });
    formCard.append(form);
    const listCard = card(`${questions.length} questões`, "", "os-manager-list");
    const list = document.createElement("div");
    list.className = "os-admin-items";
    questions.forEach((question) => {
      const item = document.createElement("article");
      item.className = "os-admin-item";
      const copy = document.createElement("div");
      copy.append(Object.assign(document.createElement("strong"), { textContent: question.skillLabel }));
      copy.append(Object.assign(document.createElement("p"), { textContent: question.prompt }));
      copy.append(Object.assign(document.createElement("small"), { textContent: `${question.area} · nível ${question.difficulty} · ${question.isActive ? "ativa" : "inativa"}` }));
      const controls = document.createElement("div");
      controls.className = "os-actions";
      const edit = button("Editar", "os-button os-button-quiet");
      edit.addEventListener("click", () => { editing = question; draw(); });
      const remove = button(question.source === "default" ? "Restaurar" : "Excluir", "os-button os-button-danger");
      remove.addEventListener("click", async () => {
        if (!window.confirm(question.source === "default" ? "Restaurar a versão original desta questão?" : "Excluir esta questão?")) return;
        await context.api.questions.remove(question.id);
        questions = await context.api.questions.list({ includeInactive: true });
        draw();
      });
      controls.append(edit, remove);
      item.append(copy, controls);
      list.append(item);
    });
    listCard.append(list);
    container.append(managerLayout(formCard, listCard));
  };
  draw();
}

async function renderNotebookManager(container, context) {
  clear(container);
  container.append(loading("Carregando notebooks…"));
  let notebooks = await context.api.notebooks.list({ includeInactive: true });
  let editing = null;
  const draw = () => {
    clear(container);
    const formCard = card(editing ? "Editar notebook" : "Novo notebook", "", "os-manager-form");
    const form = document.createElement("form");
    form.className = "os-form";
    const title = input();
    const subject = input();
    const description = textarea();
    description.rows = 4;
    const url = input("url");
    url.placeholder = "https://...";
    const active = checkbox("Notebook visível para os alunos", editing ? editing.isActive === true : true);
    if (editing) {
      title.value = editing.title;
      subject.value = editing.subject;
      description.value = editing.description;
      url.value = editing.url;
    }
    [title, subject, description].forEach((control) => { control.required = true; });
    form.append(field("Título", title), field("Matéria", subject), field("Descrição", description), field("Link HTTPS", url), active.wrapper);
    const actions = document.createElement("div");
    actions.className = "os-actions";
    const save = button("Salvar notebook", "os-button os-button-primary");
    save.type = "submit";
    actions.append(save);
    if (editing) {
      const cancel = button("Cancelar", "os-button os-button-secondary");
      cancel.addEventListener("click", () => { editing = null; draw(); });
      actions.append(cancel);
    }
    const error = status("", "error");
    error.hidden = true;
    form.append(actions, error);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      save.disabled = true;
      try {
        await context.api.notebooks.save({
          id: editing?.id || safeId("notebook", title.value),
          title: title.value,
          subject: subject.value,
          description: description.value,
          url: url.value,
          isActive: active.control.checked,
        });
        notebooks = await context.api.notebooks.list({ includeInactive: true });
        editing = null;
        draw();
      } catch (cause) {
        error.textContent = friendlyError(cause);
        error.hidden = false;
        save.disabled = false;
      }
    });
    formCard.append(form);
    const listCard = card(`${notebooks.length} notebooks`, "", "os-manager-list");
    const list = document.createElement("div");
    list.className = "os-admin-items";
    notebooks.forEach((notebook) => {
      const item = document.createElement("article");
      item.className = "os-admin-item";
      const copy = document.createElement("div");
      copy.append(Object.assign(document.createElement("strong"), { textContent: notebook.title }));
      copy.append(Object.assign(document.createElement("p"), { textContent: `${notebook.subject} · ${notebook.description}` }));
      copy.append(Object.assign(document.createElement("small"), { textContent: notebook.isActive ? "Visível" : "Inativo" }));
      const controls = document.createElement("div");
      controls.className = "os-actions";
      const edit = button("Editar", "os-button os-button-quiet");
      edit.addEventListener("click", () => { editing = notebook; draw(); });
      const remove = button(notebook.source === "default" ? "Restaurar" : "Excluir", "os-button os-button-danger");
      remove.addEventListener("click", async () => {
        if (!window.confirm(notebook.source === "default" ? "Restaurar a versão original?" : "Excluir este notebook?")) return;
        await context.api.notebooks.remove(notebook.id);
        notebooks = await context.api.notebooks.list({ includeInactive: true });
        draw();
      });
      controls.append(edit, remove);
      item.append(copy, controls);
      list.append(item);
    });
    listCard.append(list);
    container.append(managerLayout(formCard, listCard));
  };
  draw();
}

async function renderPromptManager(container, context) {
  clear(container);
  container.append(loading("Carregando prompts…"));
  let presets = await context.api.prompts.list();
  let selectedMode = "assistant";
  const draw = () => {
    clear(container);
    const picker = card("Focos disponíveis", "", "os-prompt-picker");
    presets.forEach((preset) => {
      const control = button(`${preset.label} — ${preset.customized ? "personalizado" : "padrão"}`, `os-history-item${preset.mode === selectedMode ? " is-active" : ""}`);
      control.addEventListener("click", () => { selectedMode = preset.mode; draw(); });
      picker.append(control);
    });
    const selected = presets.find((preset) => preset.mode === selectedMode);
    const editor = card(`Prompt de ${selected?.label ?? "foco"}`, "A regra-base de segurança permanece protegida no código.", "os-prompt-editor");
    const form = document.createElement("form");
    form.className = "os-form";
    const description = input();
    description.maxLength = 240;
    description.value = selected?.description ?? "";
    const instruction = textarea();
    instruction.rows = 16;
    instruction.minLength = 50;
    instruction.maxLength = 8000;
    instruction.value = selected?.instruction ?? "";
    description.required = true;
    instruction.required = true;
    const save = button("Salvar prompt", "os-button os-button-primary");
    save.type = "submit";
    const error = status("", "error");
    error.hidden = true;
    form.append(field("Descrição curta", description), field("Instrução enviada à IA", instruction), save, error);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      save.disabled = true;
      try {
        const saved = await context.api.prompts.save(selectedMode, { description: description.value, instruction: instruction.value });
        presets = presets.map((item) => item.mode === saved.mode ? saved : item);
        draw();
      } catch (cause) {
        error.textContent = friendlyError(cause);
        error.hidden = false;
        save.disabled = false;
      }
    });
    editor.append(form);
    container.append(managerLayout(picker, editor));
  };
  draw();
}

export async function renderTeacher(container, context) {
  clear(container);
  container.append(loading("Verificando autorização docente…"));
  const claims = await context.api.auth.getClaims();
  clear(container);
  if (!context.api.domain.hasTeacherAccess(claims)) {
    container.append(status("Esta área exige a custom claim teacher. Saia e entre novamente depois que o acesso for concedido.", "error"));
    return;
  }
  container.append(pageHeader("ÁREA DOCENTE", "Gestão do conteúdo pedagógico", "Edite questões, notebooks externos e instruções dos focos da IA."));
  const tabs = document.createElement("div");
  tabs.className = "os-tabs";
  const content = document.createElement("div");
  content.className = "os-tab-content";
  const routes = {
    questions: ["Questões", renderQuestionManager],
    notebooks: ["Notebooks", renderNotebookManager],
    prompts: ["Prompts da IA", renderPromptManager],
  };
  const activate = (name) => {
    [...tabs.children].forEach((item) => item.classList.toggle("is-active", item.dataset.tab === name));
    void routes[name][1](content, context).catch((error) => {
      clear(content);
      content.append(status(friendlyError(error), "error"));
    });
  };
  Object.entries(routes).forEach(([name, [label]]) => {
    const control = button(label, "os-tab");
    control.dataset.tab = name;
    control.addEventListener("click", () => activate(name));
    tabs.append(control);
  });
  container.append(tabs, content);
  activate("questions");
}
