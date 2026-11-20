# Editor de avaliações

Na **Área do professor → Criar avaliação**, escolha **Criar manualmente** para
abrir o editor ou **Importar CSV** para carregar uma avaliação existente. Se
abrir um CSV no editor, o formulário aparece com os dados importados.

1. Preencha título, tipo, versão e tempos. O código único é gerado automaticamente
   e pode ser alterado antes da publicação.
2. Adicione as questões e informe área, habilidade, origem, dificuldade,
   enunciado, cinco alternativas (A a E), resposta correta e explicação. Textos de
   apoio, imagem e observações são opcionais. Ano e número original também são
   opcionais para questões autorais. A explicação aparece no relatório após a entrega.
3. Use a lista de questões para navegar. É possível duplicar, reordenar e excluir
   questões; os identificadores são preservados e a ordem é recalculada.
4. Clique em **Revisar avaliação**. Corrija os erros indicados antes de prosseguir.
5. Escolha **Baixar CSV** ou **Publicar avaliação**. A publicação é integral e usa
   o mesmo repositório da importação por arquivo.

O editor gera o CSV com as colunas oficiais, UTF-8 e separador ponto e vírgula,
e o submete ao parser e à validação da importação existente. Alternativas vazias
são bloqueadas para impedir deslocamentos do gabarito. Os limites do arquivo
(2 MB) e dos textos também são verificados.

## Rascunhos

**Salvar rascunho** guarda o conteúdo neste navegador, separado por UID da conta.
**Recuperar rascunho** restaura o último conteúdo salvo nessa conta e navegador.
O rascunho é local e não é sincronizado com o Firebase. Trocar entre as abas da
área do professor mantém o editor montado. Sair ou recarregar a página com
alterações não salvas dispara o aviso padrão do navegador; salve antes de navegar
para outra área da aplicação.

## Compatibilidade atual

- Simulados: de 1 a 30 questões e prazo máximo de 1 a 360 minutos.
- Diagnósticos inicial e final: exatamente 25 questões e prazo máximo de 90 minutos.
- A entrega fica disponível assim que todas as respostas forem confirmadas. O importador
  ignora a coluna `tempo_minimo_minutos` em CSVs antigos.
- Questões: 1ª fase da OBB ou autorais. Quando informados, o ano deve ser de 2009
  a 2026 e o número original de 1 a 200.
- Exatamente cinco alternativas (A a E), com até 500 caracteres cada. Rascunhos
  antigos com quatro alternativas ganham o campo E vazio ao serem recuperados.
- A avaliação começa como inativa. Se o professor marcar a ativação, a publicação
  desativa a avaliação anteriormente ativa do mesmo tipo.
- Avaliações já publicadas não são editadas por este editor. Para cadastrar uma
  nova avaliação, use **Nova avaliação**, com um novo código.

## Teste de entrega

1. Na versão atual do Render, use um simulado de teste com uma questão e um tempo mínimo
   configurado. Como aluno, confirme a resposta antes desse horário e observe a espera.
2. Em homologação, com regras e backend de avaliações atualizados, publique uma avaliação
   equivalente como ativa e confirme a resposta com uma conta de aluno. O botão
   **Entregar e gerar relatório** deve estar disponível imediatamente. Repita em uma tentativa
   iniciada na versão anterior para validar a compatibilidade.
3. Repita com um diagnóstico usando uma conta de teste. A entrega deve estar disponível depois
   de confirmar todas as respostas. Confira que o prazo máximo continua sendo exibido.

O endereço local do frontend usa o Firestore e o backend definidos no `.env.local`.
Com a configuração de produção, o Firestore publicado ainda pode recusar com HTTP 403
uma nova avaliação sem o campo antigo `minMinutes`. Use um ambiente separado para
testar a publicação, pois ativar um simulado desativa o anterior do mesmo tipo.

## Imagens

Selecione um arquivo PNG, JPG, WebP, GIF, AVIF ou BMP de até 10 MB no campo de
imagem da questão. O editor converte a imagem em uma versão estática otimizada,
mostra uma prévia e permite substituí-la ou removê-la. A imagem é incorporada ao
documento da questão no Firestore e ao CSV, sem exigir hospedagem pelo professor
ou um novo bucket de Storage. A resolução e a qualidade são ajustadas para limitar
o tamanho; confira se textos e detalhes permanecem legíveis na prévia.

O importador continua aceitando URLs HTTPS de arquivos antigos e também aceita
as imagens incorporadas no CSV. A coluna `alternativa_f` é mantida
por compatibilidade com o cabeçalho anterior, mas deve ficar vazia.

As regras e a configuração de índices atualizadas em `backend/` precisam ser
implantadas para publicar imagens incorporadas e questões sem origem no Firebase
de produção. O campo `imageUrl` não é indexado.

## Preparar o CSV com outra IA

Na seção de importação, escolha **Tipo do modelo** e **Quantidade de questões**.
O tipo padrão é simulado. Diagnósticos fixam a quantidade em 25; simulados aceitam
de 1 a 30. **Baixar modelo + regras (ZIP)** entrega três arquivos:

- `modelo.csv`: cabeçalho oficial e a quantidade escolhida de exemplos provisórios;
- `REGRAS-DE-IMPORTACAO.txt`: formato, campos obrigatórios, valores permitidos,
  limites de todos os textos, publicação e tratamento das imagens;
- `PROMPT-PARA-IA.txt`: comando com o tipo e a quantidade escolhidos.

Também é possível copiar as instruções e as regras pelo botão da interface.
Envie à IA o modelo, as instruções e o documento original da prova, seja PDF,
DOCX ou outro formato que ela consiga ler. O prompt pede que a IA identifique quais
questões usam cada figura, extraia as imagens incorporadas ou recorte a região
original e entregue um CSV baixável com os dados WebP em Base64 em
`imagem_url`. Confira as figuras e os gabaritos no editor antes de publicar.

Após selecionar o CSV devolvido, as mensagens indicam linha, coluna e motivo,
distinguindo campo vazio de texto longo demais. **Abrir no editor** permite
carregar textos com erros de conteúdo para corrigi-los sem editar o CSV.
Textos longos são preservados; o professor decide como resumi-los. A quantidade
e a ordem passam a ser calculadas pelas linhas carregadas. Os dados da avaliação
vêm da primeira linha; identificadores de questões inválidos ou repetidos são
regenerados. O tipo informado é preservado: o professor pode trocar um diagnóstico
por simulado explicitamente, se essa for a intenção.

Cabeçalho inválido, linhas desalinhadas, mais de 30 questões, vários códigos no
mesmo arquivo, fase diferente de 1 ou alternativa F preenchida precisam ser
corrigidos no arquivo antes de abrir no editor.

Se uma figura indispensável não puder ser extraída pela IA, ela deve deixar
`imagem_url` vazio e registrar `[IMAGEM_PENDENTE]` em `observacoes_questao`, junto
à referência conhecida da figura, como página, seção, legenda ou questão. O
editor destaca a pendência e bloqueia a publicação até o upload da imagem. O
professor pode extrair ou capturar a figura do documento original e anexá-la. O
marcador permanece após o upload para que remover a imagem reative o bloqueio.
Também é possível marcar **Esta questão depende de uma imagem** diretamente no
editor.
