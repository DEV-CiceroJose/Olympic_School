import { strToU8, zipSync } from "fflate";
import { ASSESSMENT_TYPE_LABELS } from "@/domain/assessment";
import { MAX_ASSESSMENT_IMAGE_LENGTH } from "@/domain/assessment-image";
import { ASSESSMENT_CSV_HEADERS, serializeCsv } from "./assessment-spreadsheet";

export function buildAssessmentImportKit(type = "simulado", requestedCount = 10) {
  if (!Object.hasOwn(ASSESSMENT_TYPE_LABELS, type)) throw new Error("Selecione um tipo válido.");
  const count = type === "simulado" ? Number(requestedCount) : 25;
  if (!Number.isInteger(count) || count < 1 || count > 30)
    throw new Error("Escolha entre 1 e 30 questões.");
  const code = `${type.replaceAll("_", "-")}-obb-v1`;
  const records = Array.from({ length: count }, (_, index) => ({
    codigo_avaliacao: code,
    titulo: ASSESSMENT_TYPE_LABELS[type] + " OBB",
    tipo: type,
    versao: "1",
    quantidade_questoes: String(count),
    tempo_maximo_minutos: "90",
    avaliacao_ativa: "NAO",
    observacoes_avaliacao: "Revisar antes da publicação.",
    questao_id: `questao-${String(index + 1).padStart(2, "0")}`,
    ordem: String(index + 1),
    ano_prova: "",
    fase: "1",
    numero_original: "",
    area: "ÁREA PROVISÓRIA — SUBSTITUIR",
    habilidade_id: `habilidade-${index + 1}`,
    habilidade: "Habilidade provisória",
    dificuldade: "2",
    enunciado: `QUESTÃO PROVISÓRIA ${index + 1} — SUBSTITUIR pelo enunciado revisado.`,
    texto_apoio: "",
    imagem_url: "",
    alternativa_a: "Alternativa A provisória",
    alternativa_b: "Alternativa B provisória",
    alternativa_c: "Alternativa C provisória",
    alternativa_d: "Alternativa D provisória",
    alternativa_e: "Alternativa E provisória",
    alternativa_f: "",
    gabarito: "A",
    explicacao: "Explicação provisória — revisar.",
    fonte_url: "",
    observacoes_questao: "",
    questao_ativa: "NAO",
  }));
  const csv = serializeCsv(ASSESSMENT_CSV_HEADERS, records);
  const instructions = `GUIA DE IMPORTAÇÃO — OLYMPIC SCHOOL

CONFIGURAÇÃO DESTE PACOTE
Tipo: ${type} (${ASSESSMENT_TYPE_LABELS[type]})
Quantidade: ${count} questões
O modelo é um esqueleto com exemplos provisórios. Substitua os exemplos antes de publicar.

COMO TRABALHAR
1. Envie à IA o modelo CSV, este guia e o documento original da prova (PDF, DOCX ou outro formato que a IA consiga ler).
2. Cole também o conteúdo de PROMPT-PARA-IA.txt e confira se a IA tem acesso às fontes.
3. Importe o CSV devolvido na seção de importação da Área do professor.
4. Clique em Abrir no editor para conferir as figuras já incorporadas, corrigir textos e completar as pendências.
5. Confira cada questão, gabarito e figura. Revise a avaliação e só então publique.

FORMATO DO ARQUIVO
- CSV UTF-8, separado por ponto e vírgula (;), de até 2 MB. Um arquivo por avaliação.
- Mantenha os ${ASSESSMENT_CSV_HEADERS.length} cabeçalhos do modelo, inclusive alternativa_f vazia. Não acrescente linhas de explicação ou cercas de código Markdown.
- Envolva todos os valores em aspas duplas. Dentro de um valor, escreva cada aspa dupla duas vezes: "".
- Textos podem conter ponto e vírgula e quebras de linha quando corretamente delimitados por aspas.
- As colunas anteriores a questao_id são os dados da avaliação e devem ser idênticas em todas as linhas.
- A quantidade declarada deve coincidir com a quantidade de linhas de questões.
- Não use fórmulas de planilha. O sistema protege os textos exportados contra execução de fórmulas.

REGRAS DE CADA COLUNA
codigo_avaliacao: obrigatório; de 3 a 128 caracteres; letras minúsculas sem acentos, números e hífens; comece com letra ou número. Deve ser novo no sistema; alterar apenas versao não permite reutilizar um código já publicado.
titulo: obrigatório, até 160 caracteres.
tipo: simulado, diagnostico_inicial ou diagnostico_final. Simulado aceita de 1 a 30 questões. Diagnósticos exigem exatamente 25.
versao: inteiro de 1 a 999.
quantidade_questoes: inteiro de 1 a 30; nos diagnósticos, exatamente 25; igual ao total de linhas.
tempo_maximo_minutos: inteiro de 1 a 360 para simulados. Diagnósticos: 90.
avaliacao_ativa: SIM ou NAO. Use NAO para importar, revisar e completar as imagens. Ativar ao publicar desativa a avaliação anterior do mesmo tipo.
observacoes_avaliacao: opcional, até 2000 caracteres.
questao_id: obrigatório e único no arquivo; mesma regra de caracteres do codigo_avaliacao, de 3 a 128 caracteres.
ordem: inteiro único de 1 até quantidade_questoes; sem repetições ou lacunas.
ano_prova: opcional; vazio em questões autorais; se informado, inteiro de 2009 a 2026.
fase: 1. O modelo atual não aceita fase 2.
numero_original: opcional; vazio em questões autorais; se informado, inteiro de 1 a 200.
area: obrigatório, até 120 caracteres. Use um nome curto da área, não uma descrição longa.
habilidade_id: obrigatório, até 128 caracteres; use um identificador curto, por exemplo identificar-organelas.
habilidade: obrigatório, até 120 caracteres. Use uma frase curta, por exemplo Identificar funções das organelas. Detalhes longos pertencem a enunciado ou explicacao.
dificuldade: 1 (fácil), 2 (média) ou 3 (difícil).
enunciado: obrigatório, até 5000 caracteres.
texto_apoio: opcional, até 10000 caracteres.
imagem_url: opcional. Incorpore a figura original no formato data:image/webp;base64,<dados reais da imagem>, sem quebras de linha, até ${MAX_ASSESSMENT_IMAGE_LENGTH} caracteres incluindo o prefixo. O importador também aceita PNG/JPEG incorporados e URLs HTTPS de até 2048 caracteres. Deixe o campo vazio quando não houver figura ou houver uma pendência.
alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e: todas obrigatórias, até 500 caracteres cada; exatamente cinco alternativas.
alternativa_f: sempre vazia; coluna mantida por compatibilidade.
gabarito: apenas A, B, C, D ou E; uma única resposta correta.
explicacao: obrigatória, até 5000 caracteres; aparece no relatório após a entrega da avaliação.
fonte_url: opcional, URL HTTPS de até 2048 caracteres. Se não houver link verificável, deixe vazio.
observacoes_questao: opcional, até 2000 caracteres. Se faltar uma figura necessária, inclua [IMAGEM_PENDENTE] e a referência da prova, página e questão, quando disponíveis.
questao_ativa: SIM ou NAO. Para publicar como avaliação ativa, todas as questões devem estar SIM. Textos provisórios com SUBSTITUIR ou PROVISÓRIA não podem estar ativos.

SUGESTÕES DE ÁREA
Citologia; Botânica; Zoologia e fisiologia animal; Genética e evolução; Ecologia; Etologia; Biossistemática; Noções de farmacologia.
Esses nomes são sugestões; o sistema aceita outra área com até 120 caracteres.

FIGURAS E IMAGENS PENDENTES
- Reconheça as figuras do documento original e associe cada foto, gráfico, mapa, diagrama ou tabela visual às questões que a utilizam. Se a figura for compartilhada, inclua-a em cada questão correspondente.
- Use uma ferramenta de arquivos para extrair a imagem incorporada ou renderizar a região onde a figura aparece e recortá-la. Preserve rótulos, eixos, legendas e detalhes necessários para responder à questão.
- Codifique o recorte original em WebP e converta os bytes reais para Base64. Verifique se a imagem decodifica e continua legível. Se necessário, ajuste a qualidade ou a resolução para respeitar o limite de cada imagem e os 2 MB do CSV completo.
- Quando não conseguir extrair, codificar ou associar com segurança uma figura necessária, deixe imagem_url vazio e escreva em observacoes_questao: [IMAGEM_PENDENTE] Prova X, página Y, questão Z. Se o documento não tiver paginação estável, use a seção, a legenda ou o número da figura. Use apenas referências conhecidas.
- Para completar uma pendência, abra o CSV no editor e anexe a figura do documento original na questão correspondente. O editor aceita PNG, JPG, WebP, GIF, AVIF e BMP de até 10 MB e 40 megapixels.
- Uma questão marcada [IMAGEM_PENDENTE] só pode ser publicada depois de receber uma imagem. Confira todas as figuras na prévia.
- Use apenas figuras da fonte. Não redesenhe figuras, invente dados Base64 ou preencha com caminhos locais.

ERROS E REVISÃO
O sistema mostra linha, coluna e motivo. Campo obrigatório vazio e texto acima do limite têm mensagens diferentes, com a contagem de caracteres. É possível abrir um CSV legível no editor mesmo com erros de conteúdo. Arquivos com cabeçalho inválido, linhas desalinhadas, mais de 30 questões, vários códigos de avaliação ou alternativa F preenchida precisam ser corrigidos no arquivo antes de abrir.
Ao abrir no editor, ordem e quantidade são calculadas a partir das linhas carregadas; identificadores de questões inválidos ou repetidos são regenerados. Confira os dados antes de publicar.
`;
  const prompt = `Prepare um CSV para importar na Olympic School usando as questões e fontes que anexarei.
Configuração obrigatória: tipo=${type}; quantidade_questoes=${count}; tempo_maximo_minutos=90.
Use exatamente o cabeçalho de modelo.csv. Siga integralmente REGRAS-DE-IMPORTACAO.txt, incluindo limites de caracteres, tipos, cinco alternativas A a E e alternativa_f vazia.
Mantenha avaliacao_ativa=NAO e questao_ativa=NAO para revisão. Não publique conteúdo provisório.
Se eu pedir quantidade diferente, confirme se desejo simulado (1 a 30) ou diagnóstico (exatamente 25), sem trocar o tipo silenciosamente.
Use area e habilidade curtas, com até 120 caracteres cada. Preserve os textos científicos; não os corte apenas para caber: reescreva com clareza e respeite os limites de cada campo.
Para questões autorais, deixe ano_prova e numero_original vazios.
Identifique e associe as figuras às questões a partir do documento original (PDF, DOCX ou outro formato legível). Use uma ferramenta para extrair a imagem incorporada ou recortar a região original renderizada, preservando legendas e detalhes. Incorpore os bytes reais do recorte em imagem_url como data:image/webp;base64,<dados da imagem>, em uma única linha. Verifique a decodificação e a legibilidade, o limite de ${MAX_ASSESSMENT_IMAGE_LENGTH} caracteres por imagem e os 2 MB do CSV completo.
Se não conseguir incorporar uma figura necessária, deixe imagem_url vazio e marque [IMAGEM_PENDENTE] em observacoes_questao, com a referência conhecida (questão, página, seção ou legenda). Não invente fontes, URLs, gabaritos, figuras ou dados Base64.
Verifique os campos, os comprimentos, a contagem das questões, a ordem, os identificadores e a correspondência do gabarito antes de entregar.
Se faltar informação essencial ou você não conseguir ler uma fonte, peça esclarecimento. Não complete por suposição.
Entregue somente um arquivo CSV baixável em UTF-8, separado por ponto e vírgula, com todos os campos entre aspas duplas. Não inclua comentários fora do CSV.
`;
  return { csv, instructions, prompt, type, count };
}

export function assessmentImportKitZip(kit) {
  return zipSync({
    "modelo.csv": strToU8(`\uFEFF${kit.csv}`),
    "REGRAS-DE-IMPORTACAO.txt": strToU8(kit.instructions),
    "PROMPT-PARA-IA.txt": strToU8(kit.prompt),
  });
}

export function downloadImportKit(kit) {
  const url = URL.createObjectURL(
    new Blob([assessmentImportKitZip(kit)], { type: "application/zip" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `modelo-${kit.type}-${kit.count}-questoes.zip`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
