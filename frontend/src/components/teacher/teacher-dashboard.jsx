import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Pencil, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { DiagnosticReport } from "@/components/assessment/diagnostic-report";
import { useAuth } from "@/components/auth/auth-provider";
import { AssessmentEditor } from "@/components/teacher/assessment-editor";
import { AssessmentImportHelp } from "@/components/teacher/assessment-import-help";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SCHOOL_CLASSES, SESSION_STATUS_LABELS } from "@/domain/assessment";
import { assessmentAdminRepository } from "@/services/assessment-admin-repository";
import { assessmentSpreadsheet } from "@/services/assessment-spreadsheet";

function message(error) {
  return (
    error?.message?.replace(/^FirebaseError:\s*/, "") || "Não foi possível concluir a operação."
  );
}

function publicationMessage(error) {
  if (error?.code === "permission-denied") {
    return "O Firestore recusou a publicação. Confira a permissão de professor e se as regras do banco estão atualizadas para o editor de avaliações.";
  }
  return message(error);
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [creationMode, setCreationMode] = useState(null);
  const manualTrigger = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const editorRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [nextSessions, nextDefinitions] = await Promise.all([
        assessmentAdminRepository.sessions(),
        assessmentAdminRepository.definitions(),
      ]);
      setSessions(nextSessions);
      setDefinitions(nextDefinitions);
    } catch (error) {
      toast.error(message(error));
    }
  }, []);
  useEffect(() => void load(), [load]);

  const filtered = useMemo(
    () =>
      sessions.filter((item) => {
        const text = `${item.studentName} ${item.studentEmail}`.toLowerCase();
        return (
          (!classFilter || item.className === classFilter) &&
          (!statusFilter || item.status === statusFilter) &&
          (!search || text.includes(search.toLowerCase()))
        );
      }),
    [classFilter, search, sessions, statusFilter],
  );
  const completed = sessions.filter((item) => item.status === "completed");
  const average = completed.length
    ? Math.round(
        completed.reduce((sum, item) => sum + item.report.percentage, 0) / completed.length,
      )
    : 0;

  const inspectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setPreview(await assessmentSpreadsheet.parse(file));
    } catch (error) {
      toast.error(message(error));
      setPreview(null);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };
  const publish = async () => {
    if (!preview || preview.errors.length) return;
    setBusy(true);
    try {
      await assessmentAdminRepository.publish(preview);
      toast.success("Avaliação publicada integralmente. Nenhuma linha foi importada parcialmente.");
      setPreview(null);
      await load();
    } catch (error) {
      toast.error(publicationMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const publishFromEditor = async (assessment) => {
    setBusy(true);
    try {
      await assessmentAdminRepository.publish(assessment);
      toast.success("Avaliação cadastrada com sucesso.");
      await load();
      return true;
    } catch (error) {
      toast.error(publicationMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-medium text-primary">Acesso administrativo</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Área do professor</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Criação de avaliações, publicação das questões, acompanhamento das turmas, respostas e
        relatórios.
      </p>
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid h-auto w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="students">Alunos e respostas</TabsTrigger>
          <TabsTrigger value="questions">Criar avaliação</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Alunos registrados" value={sessions.length} />
            <Metric label="Concluídos" value={completed.length} />
            <Metric label="Em andamento" value={sessions.length - completed.length} />
            <Metric label="Média geral" value={`${average}%`} />
          </div>
          <Card className="bg-card/70">
            <CardHeader>
              <CardTitle>Avaliações cadastradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {definitions.length ? (
                definitions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Versão {item.version} · {item.questionCount} questões · código {item.id}
                      </p>
                    </div>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma avaliação importada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students" className="mt-6 space-y-5">
          <Card className="bg-card/70">
            <CardContent className="grid gap-3 p-5 md:grid-cols-4">
              <Input
                placeholder="Buscar aluno ou e-mail"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">Todas as turmas</option>
                {SCHOOL_CLASSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Todas as situações</option>
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluído</option>
              </select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void load()}>
                  <RefreshCw /> Atualizar
                </Button>
                <Button
                  variant="outline"
                  disabled={!filtered.length}
                  onClick={() => void assessmentSpreadsheet.exportTeacher(filtered)}
                >
                  <Download /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden bg-card/70">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="p-3">Aluno</th>
                      <th className="p-3">Turma</th>
                      <th className="p-3">Situação</th>
                      <th className="p-3">Início</th>
                      <th className="p-3">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer border-t hover:bg-muted/30"
                        onClick={() => item.report && setSelectedSession(item)}
                      >
                        <td className="p-3">
                          <p className="font-medium">{item.studentName}</p>
                          <p className="text-xs text-muted-foreground">{item.studentEmail}</p>
                        </td>
                        <td className="p-3">{item.className}</td>
                        <td className="p-3">{SESSION_STATUS_LABELS[item.status]}</td>
                        <td className="p-3">
                          {item.startedAt?.toDate?.().toLocaleString("pt-BR") || "—"}
                        </td>
                        <td className="p-3">{item.report ? `${item.report.percentage}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {selectedSession ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">
                  Relatório de {selectedSession.studentName}
                </h2>
                <Button variant="ghost" onClick={() => setSelectedSession(null)}>
                  Fechar
                </Button>
              </div>
              <DiagnosticReport session={selectedSession} allowExport={false} />
            </div>
          ) : null}
        </TabsContent>
        <TabsContent
          value="questions"
          forceMount
          className="mt-6 space-y-6 data-[state=inactive]:hidden"
        >
          <div role="group" aria-label="Como criar a avaliação" className="grid gap-2 sm:flex">
            <Button
              ref={manualTrigger}
              variant={creationMode === "manual" ? "default" : "outline"}
              aria-expanded={creationMode === "manual"}
              aria-controls="assessment-manual-panel"
              onClick={() => setCreationMode(creationMode === "manual" ? null : "manual")}
            >
              <Pencil /> Criar manualmente
            </Button>
            <Button
              variant={creationMode === "import" ? "default" : "outline"}
              aria-expanded={creationMode === "import"}
              aria-controls="assessment-import-panel"
              onClick={() => setCreationMode(creationMode === "import" ? null : "import")}
            >
              <FileSpreadsheet /> Importar CSV
            </Button>
          </div>
          <div id="assessment-manual-panel" hidden={creationMode !== "manual"}>
            <AssessmentEditor
              key={user.uid}
              userId={user.uid}
              busy={busy}
              onPublish={publishFromEditor}
              importRef={editorRef}
            />
          </div>
          <div id="assessment-import-panel" hidden={creationMode !== "import"}>
            <Card className="bg-card/70">
              <CardHeader>
                <CardTitle>Importar avaliação por CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Importe o CSV e abra no editor para conferir as figuras, corrigir os textos e
                  completar as pendências antes de publicar.
                </p>
                <AssessmentImportHelp />
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <label className="cursor-pointer">
                      <Upload /> {busy ? "Validando…" : "Selecionar CSV"}
                      <input
                        className="sr-only"
                        type="file"
                        accept=".csv,text/csv"
                        disabled={busy}
                        onChange={(event) => void inspectFile(event)}
                      />
                    </label>
                  </Button>
                </div>
                {preview ? (
                  <div className="rounded-xl border p-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {preview.assessment?.title || "Arquivo inválido"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {preview.questions.length} questões identificadas ·{" "}
                          {preview.errors.length} erros · {preview.warnings.length} avisos
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          disabled={
                            busy || !preview.rawRecords?.length || preview.rawRecords.length > 30
                          }
                          onClick={() => {
                            if (editorRef.current?.loadImport(preview)) {
                              setCreationMode("manual");
                              manualTrigger.current?.focus();
                            }
                          }}
                        >
                          Abrir no editor
                        </Button>
                        <Button
                          disabled={busy || preview.errors.length > 0}
                          onClick={() => void publish()}
                        >
                          Publicar avaliação
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Ao abrir no editor, quantidade e ordem são calculadas pelas linhas carregadas.
                      Identificadores de questões inválidos ou repetidos são gerados novamente.
                      Confira o tipo da avaliação e revise os dados antes de publicar.
                    </p>
                    {[...preview.errors, ...preview.warnings].length ? (
                      <ul className="mt-4 space-y-2 text-sm">
                        {preview.errors.map((item, index) => (
                          <li key={`error-${index}`} className="text-destructive">
                            Erro · {item.sheet}
                            {item.row ? ` linha ${item.row}` : ""}
                            {item.field ? ` · coluna ${item.field}` : ""}: {item.message}
                          </li>
                        ))}
                        {preview.warnings.map((item, index) => (
                          <li key={`warning-${index}`} className="text-amber-700">
                            Aviso · {item.sheet}
                            {item.row ? ` linha ${item.row}` : ""}
                            {item.field ? ` · coluna ${item.field}` : ""}: {item.message}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-emerald-700">
                        Planilha válida e pronta para publicação.
                      </p>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <Card className="bg-card/70">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
