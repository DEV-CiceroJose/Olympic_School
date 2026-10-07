import { AlertTriangle, CheckCircle2, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration, reportInsights, resultLevel } from "@/domain/assessment";
import { assessmentSpreadsheet } from "@/services/assessment-spreadsheet";

export function DiagnosticReport({ session, allowExport = true }) {
  const report = session?.report;
  if (!report) return null;
  const insights = reportInsights(report.areaResults, report.skillResults);
  return (
    <section className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Resultado geral</p>
            <p className="mt-1 text-3xl font-semibold">{report.percentage}%</p>
            <p className="text-xs text-muted-foreground">{resultLevel(report.percentage)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Acertos</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-600">{report.correctCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Erros / em branco</p>
            <p className="mt-1 text-3xl font-semibold">
              {report.incorrectCount} / {report.blankCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duração</p>
            <p className="mt-1 text-xl font-semibold">{formatDuration(report.durationSeconds)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/70">
          <CardHeader>
            <CardTitle>Desempenho por área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.areaResults.map((item) => (
              <div key={item.area}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{item.area}</span>
                  <strong>{item.percentage}%</strong>
                </div>
                <Progress value={item.percentage} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/70">
          <CardHeader>
            <CardTitle>Leitura do resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <TrendingUp className="size-4 text-emerald-500" /> Pontos fortes
              </p>
              <p className="mt-1 text-muted-foreground">
                {insights.strengths.map((item) => item.label).join(", ") ||
                  "Ainda não foi possível confirmar um ponto forte."}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4 text-amber-500" /> Prioridades
              </p>
              <p className="mt-1 text-muted-foreground">
                {insights.gaps.map((item) => item.label).join(", ") ||
                  "Nenhuma lacuna crítica foi identificada."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle>Respostas e gabarito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.questionResults.map((item) => (
            <details key={item.questionId} className="rounded-xl border p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="font-medium">Questão {item.order}</span>
                {item.correct ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-500" />
                )}
                <span className="ml-auto text-xs text-muted-foreground">{item.area}</span>
              </summary>
              <div className="mt-4 space-y-2 text-sm">
                <p>{item.prompt}</p>
                <p>
                  <strong>Sua resposta:</strong> {item.selectedAnswer || "Em branco"}
                </p>
                <p>
                  <strong>Gabarito:</strong> {item.correctAnswer}
                </p>
                <p className="text-muted-foreground">{item.explanation}</p>
              </div>
            </details>
          ))}
        </CardContent>
      </Card>
      {allowExport ? (
        <Button variant="outline" onClick={() => void assessmentSpreadsheet.exportStudent(session)}>
          <Download /> Exportar relatório em CSV
        </Button>
      ) : null}
    </section>
  );
}
