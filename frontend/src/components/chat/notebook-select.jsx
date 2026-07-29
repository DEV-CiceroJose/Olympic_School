import { Check, ChevronDown, NotebookPen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";
export function NotebookSelect({ className }) {
  const { notebooks, notebookId, setNotebookId } = useChatStore();
  const active = notebooks.find((notebook) => notebook.id === notebookId);
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex max-w-[60vw] items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <NotebookPen className="size-4 shrink-0 text-primary" />
        <span className="truncate">{active ? active.name : "Selecionar notebook"}</span>
        <ChevronDown className="size-4 shrink-0 opacity-70" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1.5">
        <p className="px-2.5 py-1.5 text-xs uppercase tracking-wide text-muted-foreground/70">
          Notebooks
        </p>
        <ul className="max-h-72 overflow-y-auto">
          {notebooks.map((notebook) => (
            <li key={notebook.id}>
              <button
                type="button"
                onClick={() => setNotebookId(notebook.id === notebookId ? null : notebook.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary",
                  notebook.id === notebookId && "bg-secondary",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{notebook.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {notebook.description}
                  </span>
                </span>
                {notebook.id === notebookId ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
