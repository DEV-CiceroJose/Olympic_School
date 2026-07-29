import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
/**
 * First-access step: there is no separate sign-up button — the profile is
 * completed automatically right after the first Google sign-in.
 */
export function ProfileDialog({ open, defaultName = "", onSubmit, onCompleted }) {
  const [name, setName] = useState(defaultName);
  const [turma, setTurma] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !turma.trim()) {
      setError("Preencha nome e turma para continuar.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name, turma });
      onCompleted();
    } catch {
      setError("Não foi possível salvar seu cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={open}>
      <DialogContent className="border-border bg-popover text-popover-foreground [&>button]:hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Complete seu cadastro</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Primeiro acesso detectado. Só precisamos de duas informações para personalizar sua
            experiência.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como devemos te chamar?"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-turma">Turma</Label>
            <Input
              id="profile-turma"
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              placeholder="Ex.: 3º ano B"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground",
              "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none",
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {saving ? "Salvando..." : "Concluir e entrar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
