import {
  button,
  card,
  clear,
  download,
  emptyState,
  friendlyError,
  loading,
  pageHeader,
  select,
  status,
  textarea,
} from "./dom.js";

function messageNode(message) {
  const node = document.createElement("article");
  node.className = `os-message os-message-${message.role}`;
  const author = document.createElement("strong");
  author.textContent = message.role === "assistant" ? "Olympic School" : "Você";
  const content = document.createElement("pre");
  content.className = "os-message-content";
  content.textContent = message.content;
  node.append(author, content);
  return { node, content };
}

export async function renderAssistant(container, context) {
  clear(container);
  container.append(loading("Carregando seu assistente…"));
  let conversations = await context.api.conversations.list().catch(() => []);
  const notebooks = await context.api.notebooks.list().catch(() => []);
  let active = null;
  let attachments = [];

  const openConversation = async (id) => {
    active = await context.api.conversations.get(id);
    draw();
  };

  const createConversation = async (notebookId = "") => {
    active = await context.api.conversations.create({ notebookId: notebookId || undefined });
    conversations = [context.api.conversations.toSummary(active), ...conversations];
    draw();
  };

  const draw = () => {
    clear(container);
    container.append(pageHeader("ASSISTENTE OLYMPIC SCHOOL", active?.title || "Nova conversa", "Use a IA como tutora, geradora de materiais e apoio à correção. Verifique informações científicas importantes."));
    const layout = document.createElement("div");
    layout.className = "os-chat-layout";
    const sidebar = card("Conversas", "", "os-chat-sidebar");
    const newButton = button("Nova conversa", "os-button os-button-primary os-button-block");
    newButton.addEventListener("click", () => void createConversation());
    sidebar.append(newButton);
    const history = document.createElement("div");
    history.className = "os-chat-history";
    conversations.forEach((conversation) => {
      const control = button(conversation.title || "Nova conversa", `os-history-item${active?.id === conversation.id ? " is-active" : ""}`);
      control.addEventListener("click", () => void openConversation(conversation.id));
      history.append(control);
    });
    sidebar.append(history);

    const workspace = document.createElement("section");
    workspace.className = "os-chat-workspace";
    if (!active) {
      const start = emptyState("Como você quer estudar hoje?", "Comece uma conversa e escolha o foco da IA.");
      if (notebooks.length) {
        const notebookSelect = select([
          { value: "", label: "Sem notebook vinculado" },
          ...notebooks.map((item) => ({ value: item.id, label: item.title })),
        ]);
        const startButton = button("Começar", "os-button os-button-primary");
        startButton.addEventListener("click", () => void createConversation(notebookSelect.value));
        start.append(notebookSelect, startButton);
      } else {
        const startButton = button("Começar", "os-button os-button-primary");
        startButton.addEventListener("click", () => void createConversation());
        start.append(startButton);
      }
      workspace.append(start);
      layout.append(sidebar, workspace);
      container.append(layout);
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "os-chat-toolbar";
    const rename = button("Renomear", "os-button os-button-quiet");
    rename.addEventListener("click", async () => {
      const title = window.prompt("Novo título da conversa", active.title);
      if (!title?.trim()) return;
      await context.api.conversations.rename(active.id, title);
      active.title = title.trim().slice(0, 160);
      conversations = conversations.map((item) => item.id === active.id ? { ...item, title: active.title } : item);
      draw();
    });
    const exportButton = button("Exportar Markdown", "os-button os-button-quiet");
    exportButton.addEventListener("click", () => {
      download(`${active.title || "conversa"}.md`, context.api.conversations.exportMarkdown(active), "text/markdown;charset=utf-8");
    });
    const clearButton = button("Limpar mensagens", "os-button os-button-quiet");
    clearButton.addEventListener("click", async () => {
      if (!window.confirm("Apagar todas as mensagens desta conversa?")) return;
      await context.api.conversations.clearMessages(active.id);
      active.messages = [];
      draw();
    });
    toolbar.append(rename, exportButton, clearButton);
    workspace.append(toolbar);

    const messages = document.createElement("div");
    messages.className = "os-messages";
    if (!active.messages.length) {
      messages.append(status("Envie uma dúvida, tema ou resposta para começar.", "info"));
    } else {
      active.messages.forEach((message) => messages.append(messageNode(message).node));
    }
    workspace.append(messages);

    const composer = document.createElement("form");
    composer.className = "os-composer";
    const modeSelect = select(Object.entries(context.api.assistant.presets).map(([value, preset]) => ({ value, label: preset.label })));
    const prompt = textarea();
    prompt.placeholder = "Digite sua dúvida ou atividade de Biologia…";
    prompt.maxLength = 12000;
    const file = document.createElement("input");
    file.type = "file";
    file.multiple = true;
    file.accept = ".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown";
    file.className = "os-file";
    const fileStatus = status("", "muted");
    fileStatus.hidden = true;
    file.addEventListener("change", async () => {
      attachments = [];
      const selectedFiles = [...file.files].slice(0, 5);
      try {
        for (const selectedFile of selectedFiles) attachments.push(await context.api.files.prepare(selectedFile));
        fileStatus.textContent = attachments.length
          ? `${attachments.length} anexo(s) preparado(s). Eles não serão armazenados após a sessão.`
          : "";
        fileStatus.hidden = !attachments.length;
      } catch (error) {
        attachments = [];
        file.value = "";
        fileStatus.textContent = friendlyError(error);
        fileStatus.className = "os-status os-status-error";
        fileStatus.hidden = false;
      }
    });
    const send = button("Enviar", "os-button os-button-primary");
    send.type = "submit";
    const composerError = status("", "error");
    composerError.hidden = true;
    const controls = document.createElement("div");
    controls.className = "os-composer-controls";
    controls.append(modeSelect, file, send);
    composer.append(prompt, controls, fileStatus, composerError);
    composer.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = prompt.value.trim();
      if (!text || send.disabled) return;
      const mode = modeSelect.value;
      send.disabled = true;
      composerError.hidden = true;
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
        status: "completed",
        mode,
        attachments,
      };
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "streaming",
        mode,
        attachments: [],
      };
      active.messages.push(userMessage, assistantMessage);
      const userNode = messageNode(userMessage);
      const assistantNode = messageNode(assistantMessage);
      messages.replaceChildren(...active.messages.slice(0, -2).map((message) => messageNode(message).node), userNode.node, assistantNode.node);
      messages.scrollTop = messages.scrollHeight;
      prompt.value = "";
      const sentAttachments = attachments;
      attachments = [];
      file.value = "";
      fileStatus.hidden = true;
      try {
        await context.api.conversations.saveMessage(active.id, userMessage);
        for await (const chunk of context.api.assistant.sendMessage({ message: text, mode, attachments: sentAttachments })) {
          assistantMessage.content += chunk;
          assistantNode.content.textContent = assistantMessage.content;
          messages.scrollTop = messages.scrollHeight;
        }
        assistantMessage.status = "completed";
        await context.api.conversations.saveMessage(active.id, assistantMessage);
        if (active.title === "Nova conversa") {
          active.title = text.replace(/\s+/g, " ").slice(0, 60);
          await context.api.conversations.updateSummary(active.id, { title: active.title, notebookId: active.notebookId });
          conversations = conversations.map((item) => item.id === active.id ? { ...item, title: active.title } : item);
        }
        if (context.api.domain.artifacts.isArtifactMode(mode) && assistantMessage.content) {
          await context.api.artifacts.save({
            id: `artifact-${assistantMessage.id}`,
            kind: mode,
            title: `${context.api.domain.artifacts.artifactLabels[mode]} — ${active.title}`,
            content: assistantMessage.content,
            sourceConversationId: active.id,
            createdAt: assistantMessage.createdAt,
          });
          const saved = status("Resposta salva também em Artefatos.", "success");
          assistantNode.node.append(saved);
        }
      } catch (error) {
        assistantMessage.status = "failed";
        composerError.textContent = friendlyError(error);
        composerError.hidden = false;
      } finally {
        send.disabled = false;
      }
    });
    workspace.append(composer);
    layout.append(sidebar, workspace);
    container.append(layout);
  };
  draw();
}
