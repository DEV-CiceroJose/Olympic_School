import { useEffect, useState } from "react";
import { BookOpen, Bot, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { diagnosticQuestions } from "@/data/diagnostic-questions";
import { externalNotebooks } from "@/data/external-notebooks";
import { notebookRepository } from "@/services/notebook-repository";
import { promptPresetRepository } from "@/services/prompt-preset-repository";
import { questionRepository } from "@/services/question-repository";

const emptyQuestion = {
  id: "",
  area: "",
  skillId: "",
  skillLabel: "",
  prompt: "",
  optionsText: "",
  correctOption: 0,
  explanation: "",
  difficulty: 1,
  isActive: true,
};

const emptyNotebook = {
  id: "",
  title: "",
  subject: "",
  description: "",
  url: "",
  isActive: true,
};

function errorMessage(error) {
  return error instanceof Error ? error.message : "Não foi possível salvar a alteração.";
}

function safeId(prefix, value) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return `${prefix}-${slug || crypto.randomUUID()}`;
}

function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyQuestion);
  const [saving, setSaving] = useState(false);

  const load = () => questionRepository.list({ includeInactive: true }).then(setQuestions);
  useEffect(() => void load(), []);

  const edit = (question) => {
    setForm({ ...question, optionsText: question.options.join("\n") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const id = form.id || safeId("question", form.prompt);
      await questionRepository.save({
        ...form,
        id,
        options: form.optionsText.split("\n"),
        correctOption: Number(form.correctOption),
        difficulty: Number(form.difficulty),
      });
      await load();
      setForm(emptyQuestion);
      toast.success("Questão salva e disponibilizada no banco.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (question) => {
    const isDefault = diagnosticQuestions.some((item) => item.id === question.id);
    if (
      !window.confirm(
        isDefault ? "Restaurar esta questão para a versão original?" : "Excluir esta questão?",
      )
    )
      return;
    try {
      await questionRepository.remove(question.id);
      await load();
      toast.success(isDefault ? "Versão original restaurada." : "Questão excluída.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="h-fit bg-card/70">
        <CardHeader>
          <CardTitle>{form.id ? "Editar questão" : "Nova questão"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Área">
                <Input
                  required
                  value={form.area}
                  onChange={(event) => setForm({ ...form, area: event.target.value })}
                />
              </Field>
              <Field label="Nome da habilidade">
                <Input
                  required
                  value={form.skillLabel}
                  onChange={(event) => setForm({ ...form, skillLabel: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Identificador da habilidade">
              <Input
                required
                placeholder="ex.: genetica_mendeliana"
                value={form.skillId}
                onChange={(event) => setForm({ ...form, skillId: event.target.value })}
              />
            </Field>
            <Field label="Enunciado">
              <Textarea
                required
                rows={4}
                value={form.prompt}
                onChange={(event) => setForm({ ...form, prompt: event.target.value })}
              />
            </Field>
            <Field label="Alternativas (uma por linha)">
              <Textarea
                required
                rows={6}
                value={form.optionsText}
                onChange={(event) => setForm({ ...form, optionsText: event.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Alternativa correta">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.correctOption}
                  onChange={(event) => setForm({ ...form, correctOption: event.target.value })}
                >
                  {form.optionsText
                    .split("\n")
                    .filter(Boolean)
                    .map((_, index) => (
                      <option key={index} value={index}>
                        {String.fromCharCode(65 + index)}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Dificuldade">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.difficulty}
                  onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
                >
                  <option value="1">1 — Introdutória</option>
                  <option value="2">2 — Intermediária</option>
                  <option value="3">3 — Avançada</option>
                </select>
              </Field>
            </div>
            <Field label="Explicação do gabarito">
              <Textarea
                required
                rows={4}
                value={form.explanation}
                onChange={(event) => setForm({ ...form, explanation: event.target.value })}
              />
            </Field>
            <CheckField
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
            >
              Questão ativa para os alunos
            </CheckField>
            <div className="flex gap-2">
              <Button disabled={saving} type="submit">
                <Save /> {saving ? "Salvando…" : "Salvar questão"}
              </Button>
              {form.id ? (
                <Button type="button" variant="outline" onClick={() => setForm(emptyQuestion)}>
                  <RotateCcw /> Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <ContentList
        title={`${questions.length} questões`}
        items={questions}
        render={(question) => (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{question.skillLabel}</strong>
                <Badge variant="outline">Nível {question.difficulty}</Badge>
                {!question.isActive ? <Badge variant="secondary">Inativa</Badge> : null}
              </div>
              <p className="mt-2 text-sm">{question.prompt}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {question.area} · {question.options.length} alternativas
              </p>
            </div>
            <ItemActions onEdit={() => edit(question)} onDelete={() => void remove(question)} />
          </div>
        )}
      />
    </div>
  );
}

function NotebookManager() {
  const [notebooks, setNotebooks] = useState([]);
  const [form, setForm] = useState(emptyNotebook);
  const [saving, setSaving] = useState(false);
  const load = () => notebookRepository.list({ includeInactive: true }).then(setNotebooks);
  useEffect(() => void load(), []);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await notebookRepository.save({ ...form, id: form.id || safeId("notebook", form.title) });
      await load();
      setForm(emptyNotebook);
      toast.success("Notebook salvo na biblioteca.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (notebook) => {
    const isDefault = externalNotebooks.some((item) => item.id === notebook.id);
    if (
      !window.confirm(
        isDefault ? "Restaurar este notebook para a versão original?" : "Excluir este notebook?",
      )
    )
      return;
    try {
      await notebookRepository.remove(notebook.id);
      await load();
      toast.success(isDefault ? "Versão original restaurada." : "Notebook excluído.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="h-fit bg-card/70">
        <CardHeader>
          <CardTitle>{form.id ? "Editar notebook" : "Novo notebook"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <Field label="Título">
              <Input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Matéria">
              <Input
                required
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>
            <Field label="Link HTTPS">
              <Input
                type="url"
                placeholder="https://..."
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
              />
            </Field>
            <CheckField
              checked={form.isActive}
              onChange={(isActive) => setForm({ ...form, isActive })}
            >
              Notebook visível para os alunos
            </CheckField>
            <div className="flex gap-2">
              <Button disabled={saving} type="submit">
                <Save /> {saving ? "Salvando…" : "Salvar notebook"}
              </Button>
              {form.id ? (
                <Button type="button" variant="outline" onClick={() => setForm(emptyNotebook)}>
                  <RotateCcw /> Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <ContentList
        title={`${notebooks.length} notebooks`}
        items={notebooks}
        render={(notebook) => (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{notebook.title}</strong>
                {!notebook.isActive ? <Badge variant="secondary">Inativo</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {notebook.subject} · {notebook.description}
              </p>
            </div>
            <ItemActions onEdit={() => setForm(notebook)} onDelete={() => void remove(notebook)} />
          </div>
        )}
      />
    </div>
  );
}

function PromptManager() {
  const [presets, setPresets] = useState([]);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [form, setForm] = useState({ description: "", instruction: "" });
  const selected = presets.find((preset) => preset.mode === selectedMode);
  useEffect(() => {
    void promptPresetRepository.list().then(setPresets);
  }, []);
  useEffect(() => {
    if (selected) setForm({ description: selected.description, instruction: selected.instruction });
  }, [selected]);
  const save = async (event) => {
    event.preventDefault();
    if (form.instruction.trim().length < 50) {
      toast.error("O prompt precisa ter pelo menos 50 caracteres.");
      return;
    }
    try {
      const saved = await promptPresetRepository.save(selectedMode, form);
      setPresets((items) => items.map((item) => (item.mode === saved.mode ? saved : item)));
      toast.success("Prompt atualizado. As próximas respostas já usarão esta instrução.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit bg-card/70">
        <CardHeader>
          <CardTitle>Focos disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {presets.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              onClick={() => setSelectedMode(preset.mode)}
              className={`w-full rounded-xl border p-3 text-left transition ${selectedMode === preset.mode ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
            >
              <span className="font-medium">{preset.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {preset.customized ? "Personalizado pelo professor" : "Prompt padrão"}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle>Prompt de {selected?.label ?? "foco"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta instrução é enviada junto com o pedido do aluno. A regra-base de segurança da IA
            permanece protegida no código.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <Field label="Descrição curta">
              <Input
                required
                maxLength={240}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>
            <Field label="Instrução enviada à IA">
              <Textarea
                required
                minLength={50}
                maxLength={8000}
                rows={16}
                value={form.instruction}
                onChange={(event) => setForm({ ...form, instruction: event.target.value })}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {form.instruction.length}/8000 caracteres
            </p>
            <Button type="submit">
              <Save /> Salvar prompt
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function CheckField({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  );
}
function ItemActions({ onEdit, onDelete }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" size="icon" variant="ghost" aria-label="Editar" onClick={onEdit}>
        <Pencil />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Excluir ou restaurar"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
function ContentList({ title, items, render }) {
  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-4">
            {render(item)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TeacherDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Acesso exclusivo</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Área do professor</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Gerencie o banco de questões, os materiais externos e as instruções usadas pelos focos da
        IA. As alterações salvas entram em vigor para todos os alunos.
      </p>
      <Tabs defaultValue="questions" className="mt-8">
        <TabsList className="grid h-auto w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="questions">
            <Plus className="mr-2 size-4" /> Questões
          </TabsTrigger>
          <TabsTrigger value="notebooks">
            <BookOpen className="mr-2 size-4" /> Notebooks
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <Bot className="mr-2 size-4" /> Prompts da IA
          </TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="mt-6">
          <QuestionManager />
        </TabsContent>
        <TabsContent value="notebooks" className="mt-6">
          <NotebookManager />
        </TabsContent>
        <TabsContent value="prompts" className="mt-6">
          <PromptManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}
