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
import { SCHOOL_CLASSES } from "@/domain/assessment";
import { cn } from "@/lib/utils";
/**
 * First-access step: there is no separate sign-up button — the profile is
 * completed automatically right after the first Google sign-in.
 */
export function ProfileDialog({
  open,
  defaultName = "",
  onSubmit,
  onCompleted,
  onOpenChange,
  updating = false,
}) {
  const [name, setName] = useState(defaultName);
  const [turma, setTurma] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);
  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !SCHOOL_CLASSES.includes(turma)) {
      setError("Preencha o nome e selecione sua turma para continuar.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "border-border bg-popover text-popover-foreground sm:max-w-md",
          !updating && "[&>button]:hidden",
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {updating ? "Atualizar cadastro" : "Complete seu cadastro"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {updating
              ? "Selecione uma turma da lista para atualizar seu perfil."
              : "Primeiro acesso detectado. Só precisamos de duas informações para personalizar sua experiência."}
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
            <select
              id="profile-turma"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              value={turma}
              onChange={(event) => setTurma(event.target.value)}
              required
            >
              <option value="" disabled>
                Escolha uma turma
              </option>
              {SCHOOL_CLASSES.map((schoolClass) => (
                <option key={schoolClass} value={schoolClass}>
                  {schoolClass}
                </option>
              ))}
            </select>
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
            {saving ? "Salvando..." : updating ? "Salvar cadastro" : "Concluir e entrar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
