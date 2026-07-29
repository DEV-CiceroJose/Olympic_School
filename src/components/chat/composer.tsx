import {
  ArrowUp,
  BrainCircuit,
  FileText,
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
import type { Attachment, AssistantMode } from "@/types/chat";
import { cn } from "@/lib/utils";

const RESOURCES: { mode: AssistantMode; label: string; icon: typeof FileText }[] = [
  { mode: "summary", label: "Gerar resumo", icon: FileText },
  { mode: "flashcards", label: "Criar flashcards", icon: ListChecks },
  { mode: "questions", label: "Praticar questões", icon: BrainCircuit },
  { mode: "mindmap", label: "Mapa mental", icon: Map },
  { mode: "study-plan", label: "Plano de estudos", icon: ListChecks },
];

export function Composer({
  onSend,
  streaming,
  onStop,
  autoFocus = true,
}: {
  onSend: (input: { text: string; mode?: AssistantMode; attachments: Attachment[] }) => void;
  streaming: boolean;
  onStop: () => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<AssistantMode | undefined>(undefined);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => fileService.upload(file)));
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error("Não foi possível anexar o arquivo.");
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
              {activeResource.label}
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
            aria-label="Adicionar recurso"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {RESOURCES.map((resource) => (
              <DropdownMenuItem key={resource.mode} onSelect={() => setMode(resource.mode)}>
                <resource.icon className="size-4 text-primary" />
                {resource.label}
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
        A BiodoraIA está em desenvolvimento — respostas podem conter imprecisões.
      </p>
    </div>
  );
}
