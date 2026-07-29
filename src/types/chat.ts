export type AssistantMode =
  "tutor" | "summary" | "questions" | "flashcards" | "mindmap" | "study-plan" | "review";

export type MessageStatus = "sending" | "streaming" | "completed" | "error";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status?: MessageStatus;
  mode?: AssistantMode;
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type Notebook = {
  id: string;
  name: string;
  description: string;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  notebookId?: string;
  messages: ChatMessage[];
};

export type ConversationSummary = Omit<Conversation, "messages">;

export type SendMessagePayload = {
  conversationId?: string;
  message: string;
  mode?: AssistantMode;
  notebookId?: string;
  attachmentIds?: string[];
};

export type AssistantChunk = { delta: string };
