import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ArrowDown, ArrowUp, Copy, Download, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSESSMENT_TYPE_LABELS } from "@/domain/assessment";
import {
  buildEditorAssessment,
  assessmentDraftSchema,
  createAssessmentDraft,
  createEditorQuestion,
  assessmentImportToDraft,
} from "@/domain/assessment-editor";
import { ASSESSMENT_CSV_HEADERS, downloadCsv } from "@/services/assessment-spreadsheet";
import { prepareAssessmentImage } from "@/services/assessment-image-upload";

const AREAS = [
  "Citologia",
  "Botânica",
  "Zoologia e fisiologia animal",
  "Genética e evolução",
  "Ecologia",
  "Etologia",
  "Biossistemática",
  "Noções de farmacologia",
];

export function AssessmentEditor({ userId, busy, onPublish, importRef }) {
  const [draft, setDraft] = useState(createAssessmentDraft);
  const [activeIndex, setActiveIndex] = useState(0);
  const [review, setReview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const reviewRef = useRef(null);
  const storageKey = `olympic-school:assessment-draft:${userId}`;
  const question = draft.questions[activeIndex];
  const missingImages = draft.questions.filter(
    (item) => item.notes.includes("[IMAGEM_PENDENTE]") && !item.imageUrl,
  ).length;

  useImperativeHandle(importRef, () => ({
    loadImport(result) {
      if (uploading) {
        toast.info("Aguarde a preparação da imagem antes de abrir outro arquivo.");
        return false;
      }
      try {
        const imported = assessmentImportToDraft(result);
        if (
          dirty &&
          !window.confirm(
            "Substituir as alterações não salvas pelas questões do CSV? Salve o rascunho antes se quiser mantê-las.",
          )
        )
          return false;
        setDraft(imported);
        setActiveIndex(0);
        setReview(null);
        setDirty(true);
        toast.success(
          "Questões carregadas no editor. Revise os campos e complete as imagens antes de publicar.",
        );
        return true;
      } catch (error) {
        toast.error(error.message);
        return false;
      }
    },
  }));

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(next) {
    setDraft(next);
    setReview(null);
    setDirty(true);
  }
  function update(field, value) {
    change({ ...draft, [field]: value });
  }
  function updateQuestion(field, value) {
    change({
      ...draft,
      questions: draft.questions.map((item, index) =>
        index === activeIndex ? { ...item, [field]: value } : item,
      ),
    });
  }
  function addQuestion(duplicate = false) {
    if (draft.questions.length >= 30) return;
    const next = duplicate
      ? { ...question, id: createEditorQuestion().id, options: [...question.options] }
      : createEditorQuestion();
    change({ ...draft, questions: [...draft.questions, next] });
    setActiveIndex(draft.questions.length);
  }
  function removeQuestion() {
    if (!window.confirm(`Excluir a questão ${activeIndex + 1}?`)) return;
    change({ ...draft, questions: draft.questions.filter((_, index) => index !== activeIndex) });
    setActiveIndex(Math.max(0, activeIndex - 1));
  }
  function moveQuestion(offset) {
    const questions = [...draft.questions];
    const target = activeIndex + offset;
    [questions[activeIndex], questions[target]] = [questions[target], questions[activeIndex]];
    change({ ...draft, questions });
    setActiveIndex(target);
  }
  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setDirty(false);
      toast.success("Rascunho salvo neste navegador, na sua conta.");
    } catch {
      toast.error("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    }
  }
  function restoreDraft() {
    if (dirty && !window.confirm("Substituir as alterações atuais pelo rascunho salvo?")) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved) return toast.info("Nenhum rascunho salvo nesta conta e navegador.");
      setDraft(assessmentDraftSchema.parse(saved));
      setActiveIndex(0);
      setReview(null);
      setDirty(false);
      toast.success("Rascunho recuperado.");
    } catch {
      toast.error("O rascunho salvo não pôde ser recuperado.");
    }
  }
  function validate() {
    const result = buildEditorAssessment(draft);
    setReview(result);
    window.setTimeout(
      () => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  }
  async function publish() {
    if (!review || review.errors.length) return;
    if (await onPublish(review)) setDirty(false);
  }
  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const questionId = question.id;
    setUploading(true);
    try {
      const imageUrl = await prepareAssessmentImage(file);
      setDraft((current) => ({
        ...current,
        questions: current.questions.map((item) =>
          item.id === questionId ? { ...item, imageUrl } : item,
        ),
      }));
      setReview(null);
      setDirty(true);
      toast.success("Imagem adicionada à questão.");
    } catch (error) {
      toast.error(error.message || "Não foi possível adicionar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <fieldset
      id="assessment-editor"
      disabled={busy || uploading}
      className="min-w-0 space-y-6 disabled:opacity-70"
    >
      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle>Criar avaliação</CardTitle>
          <p className="text-sm text-muted-foreground">
            Preencha os dados, adicione as questões e revise antes de publicar ou baixar o CSV.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={saveDraft}>
              <Save /> Salvar rascunho
            </Button>
            <Button variant="ghost" onClick={restoreDraft}>
              Recuperar rascunho
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  dirty &&
                  !window.confirm("Descartar as alterações atuais e criar outra avaliação?")
                )
                  return;
                setDraft(createAssessmentDraft());
                setActiveIndex(0);
                setReview(null);
                setDirty(false);
              }}
            >
              Nova avaliação
            </Button>
            <span className="text-xs text-muted-foreground">
              {dirty ? "Alterações não salvas" : "Rascunho local"} · O rascunho fica apenas neste
              navegador.
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título da avaliação">
              <Input
                value={draft.title}
                maxLength={160}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Ex.: Simulado de Biologia — Citologia"
              />
            </Field>
            <Field label="Tipo">
              <Select
                value={draft.type}
                onChange={(event) => {
                  change({
                    ...draft,
                    type: event.target.value,
                    ...(event.target.value !== "simulado" && { maxMinutes: "90" }),
                  });
                }}
              >
                {Object.entries(ASSESSMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Código único"
              hint="Gerado automaticamente. Use um novo código para cada avaliação."
            >
              <Input
                value={draft.code}
                maxLength={128}
                onChange={(event) => update("code", event.target.value)}
              />
            </Field>
            <Field label="Versão">
              <Input
                type="number"
                min={1}
                max={999}
                value={draft.version}
                onChange={(event) => update("version", event.target.value)}
              />
            </Field>
            <Field label="Tempo máximo (minutos)">
              <Input
                type="number"
                min={1}
                max={360}
                disabled={draft.type !== "simulado"}
                value={draft.maxMinutes}
                onChange={(event) => update("maxMinutes", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Observações da avaliação (opcional)">
            <Textarea
              maxLength={2000}
              value={draft.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => update("isActive", event.target.checked)}
              className="mt-1"
            />
            <span>
              Publicar como avaliação ativa
              <span className="mt-1 block text-xs text-muted-foreground">
                Ao publicar como ativa, a avaliação anterior do mesmo tipo será desativada.
              </span>
            </span>
          </label>
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">
            Cada avaliação aceita até 30 questões, com cinco alternativas de A a E. Para questões
            autorais, deixe ano e número original em branco. Diagnósticos exigem 25 questões e prazo
            de até 90 minutos. Simulados podem ser cadastrados, mas a realização pelos alunos ainda
            não está disponível.
          </p>
        </CardContent>
      </Card>
      {missingImages > 0 ? (
        <p
          role="status"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
        >
          {missingImages} questão(ões) com imagem pendente. Anexe as figuras antes de publicar.
        </p>
      ) : null}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="min-w-0 bg-card/70">
          <CardHeader>
            <CardTitle>Questões ({draft.questions.length}/30)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <nav aria-label="Questões da avaliação" className="max-h-96 space-y-2 overflow-y-auto">
              {draft.questions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={index === activeIndex ? "step" : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={`block w-full rounded-lg border p-3 text-left text-sm ${index === activeIndex ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                >
                  <strong>Questão {index + 1}</strong>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {item.prompt || "Sem enunciado"}
                  </span>
                  {item.notes.includes("[IMAGEM_PENDENTE]") && !item.imageUrl ? (
                    <span className="mt-1 block text-xs text-amber-600">Imagem pendente</span>
                  ) : null}
                </button>
              ))}
            </nav>
            <Button
              className="w-full"
              variant="outline"
              disabled={draft.questions.length >= 30}
              onClick={() => addQuestion()}
            >
              <Plus /> Adicionar questão
            </Button>
          </CardContent>
        </Card>
        <Card id="assessment-editor-question" className="min-w-0 bg-card/70">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Questão {activeIndex + 1}</CardTitle>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Mover questão para cima"
                  disabled={activeIndex === 0}
                  onClick={() => moveQuestion(-1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Mover questão para baixo"
                  disabled={activeIndex === draft.questions.length - 1}
                  onClick={() => moveQuestion(1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  disabled={draft.questions.length >= 30}
                  onClick={() => addQuestion(true)}
                >
                  <Copy /> Duplicar
                </Button>
                <Button
                  variant="ghost"
                  disabled={draft.questions.length === 1}
                  onClick={removeQuestion}
                >
                  <Trash2 /> Excluir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Área de Biologia">
                <Input
                  list="assessment-areas"
                  maxLength={120}
                  value={question.area}
                  onChange={(event) => updateQuestion("area", event.target.value)}
                  placeholder="Selecione ou digite uma área"
                />
                <datalist id="assessment-areas">
                  {AREAS.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </Field>
              <Field label="Habilidade avaliada">
                <Input
                  maxLength={120}
                  value={question.skillLabel}
                  onChange={(event) => updateQuestion("skillLabel", event.target.value)}
                  placeholder="Ex.: Identificar organelas celulares"
                />
              </Field>
              <Field label="Ano da prova original (opcional)">
                <Input
                  type="number"
                  min={2009}
                  max={2026}
                  value={question.examYear}
                  onChange={(event) => updateQuestion("examYear", event.target.value)}
                />
              </Field>
              <Field label="Número da questão original (opcional)">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={question.originalNumber}
                  onChange={(event) => updateQuestion("originalNumber", event.target.value)}
                />
              </Field>
              <Field label="Dificuldade">
                <Select
                  value={question.difficulty}
                  onChange={(event) => updateQuestion("difficulty", event.target.value)}
                >
                  <option value="1">Fácil</option>
                  <option value="2">Média</option>
                  <option value="3">Difícil</option>
                </Select>
              </Field>
            </div>
            <Field label="Enunciado">
              <Textarea
                rows={5}
                maxLength={5000}
                value={question.prompt}
                onChange={(event) => updateQuestion("prompt", event.target.value)}
                placeholder="Escreva a pergunta que o aluno verá."
              />
            </Field>
            <Field label="Texto de apoio (opcional)">
              <Textarea
                rows={3}
                maxLength={10000}
                value={question.supportText}
                onChange={(event) => updateQuestion("supportText", event.target.value)}
              />
            </Field>
            <Field
              label="Imagem da questão (opcional)"
              hint="Selecione uma imagem do computador, de até 10 MB. Ela será otimizada e incorporada à avaliação, sem precisar de hospedagem externa."
            >
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp"
                onChange={(event) => void uploadImage(event)}
              />
            </Field>
            {uploading ? (
              <p role="status" className="text-sm text-muted-foreground">
                Preparando imagem…
              </p>
            ) : null}
            {question.imageUrl ? (
              <div className="space-y-3">
                <img
                  src={question.imageUrl}
                  alt={`Prévia da imagem da questão ${activeIndex + 1}`}
                  className="max-h-80 max-w-full rounded-lg border object-contain"
                />
                <Button variant="outline" onClick={() => updateQuestion("imageUrl", "")}>
                  <Trash2 /> Remover imagem
                </Button>
              </div>
            ) : null}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={question.notes.includes("[IMAGEM_PENDENTE]")}
                onChange={(event) =>
                  updateQuestion(
                    "notes",
                    event.target.checked
                      ? `[IMAGEM_PENDENTE] ${question.notes}`.trim()
                      : question.notes.replaceAll("[IMAGEM_PENDENTE]", "").trim(),
                  )
                }
              />
              <span>
                Esta questão depende de uma imagem
                <span className="mt-1 block text-xs text-muted-foreground">
                  Enquanto estiver marcada e sem imagem, a publicação será bloqueada.
                </span>
              </span>
            </label>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-medium">Alternativas e gabarito</legend>
              <p className="text-xs text-muted-foreground">
                Preencha todas as alternativas e marque a única resposta correta.
              </p>
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${question.correctOption === String(index) ? "border-primary bg-primary/5" : ""}`}
                >
                  <label className="flex shrink-0 items-center gap-2 pt-2 text-sm">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      value={index}
                      checked={question.correctOption === String(index)}
                      onChange={() => updateQuestion("correctOption", String(index))}
                      aria-label={`Alternativa ${String.fromCharCode(65 + index)} é a correta`}
                    />
                    {String.fromCharCode(65 + index)}
                  </label>
                  <Textarea
                    aria-label={`Texto da alternativa ${String.fromCharCode(65 + index)}`}
                    maxLength={500}
                    value={option}
                    onChange={(event) =>
                      updateQuestion(
                        "options",
                        question.options.map((item, optionIndex) =>
                          optionIndex === index ? event.target.value : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </fieldset>
            <Field
              label="Explicação do gabarito"
              hint="O aluno verá esta explicação no relatório após entregar a avaliação, junto à resposta correta."
            >
              <Textarea
                rows={3}
                maxLength={5000}
                value={question.explanation}
                onChange={(event) => updateQuestion("explanation", event.target.value)}
                placeholder="Explique por que a alternativa está correta."
              />
            </Field>
            <Field label="URL da fonte (opcional)">
              <Input
                type="url"
                maxLength={2048}
                value={question.sourceUrl}
                onChange={(event) => updateQuestion("sourceUrl", event.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Observações da questão (opcional)">
              <Textarea
                maxLength={2000}
                value={question.notes}
                onChange={(event) => updateQuestion("notes", event.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={validate}>Revisar avaliação</Button>
        <p className="text-sm text-muted-foreground">
          {draft.questions.length} questões · até {draft.maxMinutes || "—"} minutos
        </p>
      </div>
      {review ? (
        <Card ref={reviewRef} className="bg-card/70" aria-live="polite">
          <CardHeader>
            <CardTitle>Revisão: {review.assessment?.title || "Avaliação sem título"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              {review.questions.length} questões · {review.errors.length} erros ·{" "}
              {review.warnings.length} avisos ·{" "}
              {draft.isActive ? "Será ativada ao publicar" : "Será cadastrada como inativa"}
            </p>
            {review.errors.length || review.warnings.length ? (
              <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
                {[...review.errors, ...review.warnings].map((item, index) => (
                  <li
                    key={index}
                    className={index < review.errors.length ? "text-destructive" : "text-amber-700"}
                  >
                    {item.row >= 2 && !ASSESSMENT_CSV_HEADERS.slice(0, 9).includes(item.field) ? (
                      <button
                        type="button"
                        className="mr-1 underline"
                        onClick={() => {
                          setActiveIndex(item.row - 2);
                          window.setTimeout(
                            () =>
                              document
                                .getElementById("assessment-editor-question")
                                ?.scrollIntoView({ behavior: "smooth" }),
                            0,
                          );
                        }}
                      >
                        Questão {item.row - 1}
                      </button>
                    ) : (
                      "Avaliação: "
                    )}
                    {item.field ? <strong className="mr-1">{item.field}:</strong> : null}
                    {item.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-700">
                Avaliação válida. Confira os enunciados e gabaritos antes de publicar.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={review.errors.length > 0}
                onClick={() => {
                  downloadCsv(review.csv, `${draft.code}.csv`);
                  toast.success("CSV gerado no modelo da plataforma.");
                }}
              >
                <Download /> Baixar CSV
              </Button>
              <Button disabled={review.errors.length > 0} onClick={() => void publish()}>
                {busy ? "Publicando…" : "Publicar avaliação"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </fieldset>
  );
}

function Field({ label, hint, children }) {
  const id = useId();
  const [control, ...rest] = Children.toArray(children);
  return (
    <div className="space-y-2 text-sm">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {cloneElement(control, { id, "aria-describedby": hint ? `${id}-hint` : undefined })}
      {rest}
      {hint ? (
        <span id={`${id}-hint`} className="block text-xs text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function Select(props) {
  return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...props} />;
}
