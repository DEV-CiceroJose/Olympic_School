import {
  ArrowUp,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ListChecks,
  Loader2,
  Map,
  Paperclip,
  Plus,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fileService } from "@/services/fileService";
import { AI_FOCUS_PRESETS } from "@/domain/ai-focus-presets";
import { cn } from "@/lib/utils";
const FOCUS_ICONS = {
  tutor: GraduationCap,
  summary: FileText,
  flashcards: ListChecks,
  questions: BrainCircuit,
  mindmap: Map,
  "study-plan": ListChecks,
  review: ClipboardCheck,
};
const RESOURCES = Object.entries(FOCUS_ICONS).map(([mode, icon]) => ({
  mode,
  icon,
  ...AI_FOCUS_PRESETS[mode],
}));
export function Composer({ onSend, streaming, onStop, autoFocus = true }) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState(undefined);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (!streaming) textareaRef.current?.focus();
  }, [streaming]);
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);
  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    onSend({ text, mode, attachments });
    setValue("");
    setAttachments([]);
    setMode(undefined);
  };
  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await fileService.uploadMany(files, attachments);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível anexar o arquivo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const activeResource = RESOURCES.find((resource) => resource.mode === mode);
  return (
    <div className="w-full">
      {attachments.length > 0 || activeResource ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {activeResource ? (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs text-primary ring-1 ring-primary/30">
              <activeResource.icon className="size-3.5" />
              Foco: {activeResource.label}
              <button type="button" onClick={() => setMode(undefined)} aria-label="Remover recurso">
                <X className="size-3.5" />
              </button>
            </span>
          ) : null}
          {attachments.map((attachment) => (
            <span
              key={attachment.id}
              className="flex max-w-56 items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
            >
              <Paperclip className="size-3.5 shrink-0" />
              <span className="truncate">{attachment.name}</span>
              <button
                type="button"
                aria-label={`Remover ${attachment.name}`}
                onClick={() =>
                  setAttachments((prev) => prev.filter((item) => item.id !== attachment.id))
                }
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-[28px] border border-border bg-card/70 p-2 shadow-lg backdrop-blur-xl transition-colors focus-within:border-primary/40">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Adicionar ferramenta"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {RESOURCES.map((resource) => (
              <DropdownMenuItem
                key={resource.mode}
                onSelect={() => setMode(resource.mode)}
                className="items-start py-2.5"
              >
                <resource.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <span className="block font-medium text-foreground">{resource.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {resource.description}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
              <Paperclip className="size-4 text-primary" />
              Anexar arquivo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Pergunte qualquer coisa sobre Biologia..."
          aria-label="Mensagem"
          className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {uploading ? (
          <span className="grid size-10 place-items-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </span>
        ) : null}

        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Parar geração"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <Square className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Enviar mensagem"
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-110",
              !value.trim() && "cursor-not-allowed opacity-40 hover:brightness-100",
            )}
          >
            <ArrowUp className="size-5" />
          </button>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground/70">
        A IA pode cometer erros. Confira informações importantes.
      </p>
    </div>
  );
}
