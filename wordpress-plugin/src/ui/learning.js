import {
  button,
  card,
  clear,
  emptyState,
  field,
  friendlyError,
  input,
  loading,
  pageHeader,
  status,
} from "./dom.js";

const WEEK_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const ACTIVITY_LABELS = {
  concept: "Conceito guiado",
  questions: "Questões",
  review: "Revisão",
  simulation: "Simulado",
};

function progress(value) {
  const wrapper = document.createElement("div");
  wrapper.className = "os-progress";
  const fill = document.createElement("span");
  fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
  wrapper.append(fill);
  return wrapper;
}

function actionCard(title, copy, action, onClick) {
  const node = card(title, copy, "os-action-card");
  const control = button(action, "os-button os-button-secondary");
  control.addEventListener("click", onClick);
  node.append(control);
  return node;
}

export async function renderDashboard(container, context) {
  clear(container);
  container.append(loading("Preparando sua trilha…"));
  const [snapshot, plans, artifacts] = await Promise.all([
    context.api.learning.getSnapshot(),
    context.api.studyPlans.list().catch(() => []),
    context.api.artifacts.list().catch(() => []),
  ]);
  clear(container);
  container.append(pageHeader(
    "ÁREA DO ESTUDANTE",
    `Olá, ${context.profile.name || "estudante"}.`,
    "Seu estudo é guiado por evidências registradas em cada atividade.",
  ));
  const average = snapshot.mastery.length
    ? Math.round(snapshot.mastery.reduce((sum, item) => sum + item.score, 0) / snapshot.mastery.length)
    : 0;
  const metrics = document.createElement("div");
  metrics.className = "os-metrics";
  [["Domínio médio", `${average}`], ["Tentativas", `${snapshot.attempts.length}`], ["Planos", `${plans.length}`], ["Materiais", `${artifacts.length}`]]
    .forEach(([label, value]) => {
      const metric = card("", "", "os-metric");
      metric.append(document.createTextNode(value));
      const text = document.createElement("span");
      text.textContent = label;
      metric.append(text);
      metrics.append(metric);
    });
  container.append(metrics);
  const grid = document.createElement("div");
  grid.className = "os-grid";
  grid.append(
    actionCard("Diagnóstico", "Descubra suas lacunas por habilidade.", "Começar", () => context.navigate("diagnostic")),
    actionCard("Treino adaptativo", "Receba a próxima questão conforme suas evidências.", "Treinar", () => context.navigate("training")),
    actionCard("Progresso", "Acompanhe domínio, acertos e confiança.", "Ver progresso", () => context.navigate("progress")),
    actionCard("Plano de estudo", "Organize sessões, revisões e simulados.", "Abrir planos", () => context.navigate("plans")),
    actionCard("Assistente", "Estude com tutor, resumos e questões geradas.", "Conversar", () => context.navigate("assistant")),
    actionCard("Artefatos", "Consulte materiais que você decidiu salvar.", "Ver materiais", () => context.navigate("artifacts")),
  );
  container.append(grid);
}

export async function renderDiagnostic(container, context) {
  clear(container);
  container.append(loading("Carregando banco de questões…"));
  const questions = (await context.api.questions.list()).slice(0, 15);
  if (!questions.length) {
    clear(container);
    container.append(emptyState("Nenhuma questão ativa", "Peça a um professor para revisar o banco de questões."));
    return;
  }
  let index = 0;
  let selected = null;
  let attempts = [];
  let startedAt = Date.now();

  const finish = async () => {
    const mastery = context.api.domain.learning.masteryFromDiagnostic(questions, attempts);
    const percentage = context.api.domain.learning.diagnosticPercentage(attempts);
    await Promise.allSettled([
      context.api.learning.saveMastery(mastery),
      context.api.learning.saveEvent({
        id: crypto.randomUUID(),
        type: "diagnostic_completed",
        score: percentage,
        occurredAt: new Date().toISOString(),
      }),
    ]);
    clear(container);
    container.append(pageHeader("DIAGNÓSTICO CONCLUÍDO", `${percentage}% de acertos`, "O resultado por habilidade é mais importante que a média geral."));
    const grid = document.createElement("div");
    grid.className = "os-grid os-grid-two";
    [...mastery].sort((a, b) => a.score - b.score).forEach((item) => {
      const node = card(item.label, `${context.api.domain.learning.masteryLevel(item.score)} · ${item.correctAttempts}/${item.attempts} acertos`);
      const value = document.createElement("strong");
      value.className = "os-score";
      value.textContent = `${item.score}`;
      node.prepend(value);
      node.append(progress(item.score));
      grid.append(node);
    });
    container.append(grid);
    const insights = context.api.domain.learning.diagnosticRecommendations(mastery);
    const reading = card("Próximos passos", "", "os-wide-card");
    const list = document.createElement("ul");
    list.className = "os-list";
    insights.nextSteps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step.text;
      list.append(item);
    });
    reading.append(list);
    const actions = document.createElement("div");
    actions.className = "os-actions";
    const training = button("Iniciar treino adaptativo", "os-button os-button-primary");
    training.addEventListener("click", () => context.navigate("training"));
    const restart = button("Refazer diagnóstico", "os-button os-button-secondary");
    restart.addEventListener("click", async () => {
      if (!window.confirm("Apagar o diagnóstico e o progresso de treino registrados nesta conta?")) return;
      await context.api.learning.resetDiagnostic();
      index = 0;
      selected = null;
      attempts = [];
      startedAt = Date.now();
      draw();
    });
    actions.append(training, restart);
    container.append(reading, actions);
  };

  const draw = () => {
    if (index >= questions.length) {
      void finish().catch((error) => {
        clear(container);
        container.append(status(friendlyError(error), "error"));
      });
      return;
    }
    const question = questions[index];
    clear(container);
    const header = pageHeader(question.area, `Questão ${index + 1} de ${questions.length}`, question.skillLabel);
    header.append(progress((index / questions.length) * 100));
    container.append(header);
    const questionCard = card(question.prompt, "", "os-question");
    const options = document.createElement("div");
    options.className = "os-options";
    question.options.forEach((option, optionIndex) => {
      const choice = button(`${String.fromCharCode(65 + optionIndex)}. ${option}`, "os-option");
      if (selected !== null) {
        choice.disabled = true;
        if (optionIndex === question.correctOption) choice.classList.add("is-correct");
        if (optionIndex === selected && selected !== question.correctOption) choice.classList.add("is-wrong");
      }
      choice.addEventListener("click", async () => {
        if (selected !== null) return;
        selected = optionIndex;
        const attempt = context.api.domain.learning.evaluateAnswer(question, optionIndex, Date.now() - startedAt);
        attempts.push(attempt);
        await context.api.learning.saveAttempt(attempt).catch(() => undefined);
        draw();
      });
      options.append(choice);
    });
    questionCard.append(options);
    if (selected !== null) {
      const feedback = status(
        `${selected === question.correctOption ? "Resposta correta." : "Revise este conceito."} ${question.explanation}`,
        selected === question.correctOption ? "success" : "warning",
      );
      const next = button(index === questions.length - 1 ? "Ver resultado" : "Próxima questão", "os-button os-button-primary");
      next.addEventListener("click", () => {
        index += 1;
        selected = null;
        startedAt = Date.now();
        draw();
      });
      questionCard.append(feedback, next);
    }
    container.append(questionCard);
  };
  draw();
}

export async function renderTraining(container, context) {
  clear(container);
  container.append(loading("Carregando seu treino…"));
  const [questions, snapshot, plans] = await Promise.all([
    context.api.questions.list(),
    context.api.learning.getSnapshot(),
    context.api.studyPlans.list().catch(() => []),
  ]);
  let mastery = snapshot.mastery;
  let attempts = snapshot.attempts;
  let selected = null;
  let startedAt = Date.now();
  if (!mastery.length) {
    clear(container);
    const empty = emptyState("Precisamos medir seu ponto de partida", "Faça o diagnóstico antes do treino para usar evidências reais.");
    const action = button("Começar diagnóstico", "os-button os-button-primary");
    action.addEventListener("click", () => context.navigate("diagnostic"));
    empty.append(action);
    container.append(empty);
    return;
  }
  const plan = plans[0];
  const adaptiveContext = {
    targetOlympiad: plan?.input.targetOlympiad,
    priorityTopics: [
      ...(plan?.input.priorityTopics ?? []),
      ...(plan?.sessions.filter((session) => !session.completed).map((session) => session.topic) ?? []),
    ],
  };
  let currentQuestion = context.api.domain.learning.selectNextQuestion(questions, mastery, attempts, adaptiveContext);
  const draw = () => {
    const question = currentQuestion;
    clear(container);
    if (!question) {
      container.append(emptyState("Nenhuma questão disponível", "O banco de treino não possui questões ativas."));
      return;
    }
    const current = mastery.find((item) => item.skillId === question.skillId);
    container.append(pageHeader("TREINO ADAPTATIVO", question.skillLabel, `Domínio ${current?.score ?? 0} · ${context.api.domain.learning.masteryLevel(current?.score ?? 0)}`));
    container.append(status(context.api.domain.learning.adaptiveReasonFor(question, mastery, attempts, adaptiveContext), "info"));
    const node = card(question.prompt, `Dificuldade ${question.difficulty}`, "os-question");
    const options = document.createElement("div");
    options.className = "os-options";
    question.options.forEach((option, optionIndex) => {
      const choice = button(`${String.fromCharCode(65 + optionIndex)}. ${option}`, "os-option");
      choice.disabled = selected !== null;
      if (selected !== null && optionIndex === question.correctOption) choice.classList.add("is-correct");
      if (selected === optionIndex && optionIndex !== question.correctOption) choice.classList.add("is-wrong");
      choice.addEventListener("click", async () => {
        if (selected !== null) return;
        selected = optionIndex;
        const attempt = context.api.domain.learning.evaluateAnswer(question, optionIndex, Date.now() - startedAt);
        const existing = current ?? {
          skillId: question.skillId,
          label: question.skillLabel,
          score: 0,
          attempts: 0,
          correctAttempts: 0,
          confidence: "low",
        };
        const updated = context.api.domain.learning.updateMastery(existing, attempt);
        mastery = mastery.some((item) => item.skillId === updated.skillId)
          ? mastery.map((item) => item.skillId === updated.skillId ? updated : item)
          : [...mastery, updated];
        attempts = [...attempts, attempt];
        await Promise.allSettled([
          context.api.learning.saveAttempt(attempt),
          context.api.learning.saveMastery(mastery),
          context.api.learning.saveEvent({ id: crypto.randomUUID(), type: "training_attempt", skillId: question.skillId, score: updated.score, occurredAt: attempt.answeredAt }),
        ]);
        draw();
      });
      options.append(choice);
    });
    node.append(options);
    if (selected !== null) {
      const latest = attempts.at(-1);
      node.append(status(`${latest.correct ? "Resposta correta." : "Erro registrado."} ${question.explanation}`, latest.correct ? "success" : "warning"));
      const next = button("Selecionar próxima atividade", "os-button os-button-primary");
      next.addEventListener("click", () => {
        selected = null;
        startedAt = Date.now();
        currentQuestion = context.api.domain.learning.selectNextQuestion(questions, mastery, attempts, adaptiveContext);
        draw();
      });
      node.append(next);
    }
    container.append(node);
  };
  draw();
}

export async function renderProgress(container, context) {
  clear(container);
  container.append(loading("Carregando seu progresso…"));
  const snapshot = await context.api.learning.getSnapshot();
  const mastery = [...snapshot.mastery].sort((a, b) => a.score - b.score);
  clear(container);
  if (!mastery.length) {
    const empty = emptyState("Seu progresso começa com evidências", "Conclua o diagnóstico para criar seu mapa de domínio.");
    const action = button("Fazer diagnóstico", "os-button os-button-primary");
    action.addEventListener("click", () => context.navigate("diagnostic"));
    empty.append(action);
    container.append(empty);
    return;
  }
  const average = Math.round(mastery.reduce((sum, item) => sum + item.score, 0) / mastery.length);
  container.append(pageHeader("PROGRESSO OBJETIVO", `${average} de domínio médio`, `Calculado a partir de ${snapshot.events.length} eventos sincronizados.`));
  const grid = document.createElement("div");
  grid.className = "os-grid os-grid-two";
  mastery.forEach((item) => {
    const node = card(item.label, `${context.api.domain.learning.masteryLevel(item.score)} · ${item.correctAttempts}/${item.attempts} acertos · confiança ${item.confidence}`);
    node.prepend(Object.assign(document.createElement("strong"), { className: "os-score", textContent: `${item.score}` }));
    node.append(progress(item.score));
    grid.append(node);
  });
  container.append(grid);
}

export async function renderPlans(container, context) {
  clear(container);
  container.append(loading("Carregando planos…"));
  let plans = await context.api.studyPlans.list();
  const draw = () => {
    clear(container);
    container.append(pageHeader("PLANO DE ESTUDO", "Organize sua preparação", "O gerador prioriza habilidades com menor domínio e intercala conceito, questões, revisão e simulado."));
    const formCard = card("Novo plano", "", "os-wide-card");
    const form = document.createElement("form");
    form.className = "os-form os-form-grid";
    const target = input();
    target.value = "OBB";
    const examDate = input("date");
    const minutes = input("number");
    minutes.min = "15";
    minutes.max = "240";
    minutes.value = "45";
    form.append(field("Olimpíada", target), field("Data da prova", examDate), field("Minutos por sessão", minutes));
    const daySet = new Set(["Terça", "Quinta", "Sábado"]);
    const dayField = document.createElement("fieldset");
    dayField.className = "os-day-picker";
    dayField.append(Object.assign(document.createElement("legend"), { textContent: "Dias disponíveis" }));
    WEEK_DAYS.forEach((day) => {
      const control = button(day, `os-chip${daySet.has(day) ? " is-active" : ""}`);
      control.addEventListener("click", () => {
        if (daySet.has(day)) daySet.delete(day); else daySet.add(day);
        control.classList.toggle("is-active", daySet.has(day));
      });
      dayField.append(control);
    });
    const submit = button("Gerar plano", "os-button os-button-primary");
    submit.type = "submit";
    const formStatus = status("", "error");
    formStatus.hidden = true;
    form.append(dayField, submit, formStatus);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!daySet.size) {
        formStatus.textContent = "Selecione pelo menos um dia.";
        formStatus.hidden = false;
        return;
      }
      submit.disabled = true;
      try {
        const id = `plan-${Date.now()}`;
        const createdAt = new Date().toISOString();
        const mastery = await context.api.learning.getMastery();
        const plan = context.api.domain.studyPlans.generateStudyPlan(id, createdAt, {
          targetOlympiad: target.value.trim() || "Olimpíada de Biologia",
          examDate: examDate.value || undefined,
          availableDays: [...daySet],
          minutesPerDay: Math.max(15, Number(minutes.value) || 45),
          priorityTopics: [],
        }, mastery);
        await context.api.studyPlans.save(plan);
        await context.api.artifacts.save({
          id: `artifact-${id}`,
          kind: "study-plan",
          title: `Plano ${plan.input.targetOlympiad}`,
          content: [plan.objective, "", ...plan.sessions.map((session) => `- Semana ${session.week}, ${session.day}: ${session.topic} — ${ACTIVITY_LABELS[session.activity]} (${session.minutes} min)`)].join("\n"),
          createdAt,
        });
        plans = [plan, ...plans];
        draw();
      } catch (error) {
        formStatus.textContent = friendlyError(error);
        formStatus.hidden = false;
        submit.disabled = false;
      }
    });
    formCard.append(form);
    container.append(formCard);
    const list = document.createElement("div");
    list.className = "os-stack";
    if (!plans.length) list.append(emptyState("Nenhum plano criado", "Gere seu primeiro plano usando o formulário acima."));
    plans.forEach((plan) => {
      const completed = plan.sessions.filter((session) => session.completed).length;
      const node = card(plan.input.targetOlympiad, `${completed}/${plan.sessions.length} sessões concluídas`, "os-plan");
      node.append(progress((completed / plan.sessions.length) * 100));
      const sessions = document.createElement("div");
      sessions.className = "os-session-grid";
      plan.sessions.forEach((session) => {
        const control = button(`${session.completed ? "✓ " : ""}${session.topic} — Semana ${session.week}, ${session.day} · ${ACTIVITY_LABELS[session.activity]} · ${session.minutes} min`, `os-session${session.completed ? " is-complete" : ""}`);
        control.addEventListener("click", async () => {
          const updated = await context.api.studyPlans.toggleSession(plan, session.id);
          plans = plans.map((item) => item.id === plan.id ? updated : item);
          draw();
        });
        sessions.append(control);
      });
      const remove = button("Excluir plano", "os-button os-button-danger");
      remove.addEventListener("click", async () => {
        if (!window.confirm("Excluir este plano?")) return;
        await context.api.studyPlans.remove(plan.id);
        plans = plans.filter((item) => item.id !== plan.id);
        draw();
      });
      node.append(sessions, remove);
      list.append(node);
    });
    container.append(list);
  };
  draw();
}

export async function renderNotebooks(container, context) {
  clear(container);
  container.append(loading("Carregando materiais externos…"));
  const notebooks = await context.api.notebooks.list();
  clear(container);
  container.append(pageHeader("NOTEBOOKS EXTERNOS", "Biblioteca complementar", "Os links abrem em uma nova aba e não são sincronizados automaticamente com a IA."));
  const grid = document.createElement("div");
  grid.className = "os-grid os-grid-two";
  notebooks.forEach((notebook) => {
    const node = card(notebook.title, `${notebook.subject} · ${notebook.description}`);
    if (/^https:\/\//i.test(notebook.url ?? "")) {
      const anchor = document.createElement("a");
      anchor.className = "os-button os-button-secondary";
      anchor.href = notebook.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "Abrir notebook";
      node.append(anchor);
    } else {
      node.append(status("Link ainda não cadastrado.", "warning"));
    }
    grid.append(node);
  });
  container.append(grid);
}

export async function renderArtifacts(container, context) {
  clear(container);
  container.append(loading("Carregando materiais salvos…"));
  let artifacts = await context.api.artifacts.list();
  const draw = () => {
    clear(container);
    container.append(pageHeader("MATERIAIS SALVOS", "Artefatos de estudo", "Resumos, questões, flashcards, mapas mentais e planos que você decidiu guardar."));
    if (!artifacts.length) {
      container.append(emptyState("Nenhum artefato salvo", "Gere um recurso no assistente ou crie um plano de estudo."));
      return;
    }
    const grid = document.createElement("div");
    grid.className = "os-grid os-grid-two";
    artifacts.forEach((artifact) => {
      const node = card(artifact.title, context.api.domain.artifacts.artifactLabels[artifact.kind] ?? artifact.kind);
      const content = document.createElement("pre");
      content.className = "os-document";
      content.textContent = artifact.content;
      const actions = document.createElement("div");
      actions.className = "os-actions";
      const copy = button("Copiar", "os-button os-button-secondary");
      copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(artifact.content);
        copy.textContent = "Copiado";
      });
      const remove = button("Excluir", "os-button os-button-danger");
      remove.addEventListener("click", async () => {
        if (!window.confirm("Excluir este material?")) return;
        await context.api.artifacts.remove(artifact.id);
        artifacts = artifacts.filter((item) => item.id !== artifact.id);
        draw();
      });
      actions.append(copy, remove);
      node.append(content, actions);
      grid.append(node);
    });
    container.append(grid);
  };
  draw();
}
