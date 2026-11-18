# Contexto para continuar em outra máquina

Leia primeiro AGENTS.md. Projeto conectado ao Lovable: nunca force push nem reescreva commits publicados.

## Objetivo e estado

Olympic School é uma plataforma de preparação para olimpíadas de Biologia. Frontend React 19, TanStack Router/Start, Vite 8, Tailwind e Firebase. Backend gerenciado com Authentication, Firestore e Cloud Functions. Banco nomeado biodoraia, região southamerica-east1.

Origem histórica: https://github.com/DEV-CiceroJose/Olympic_School, branch feat/mvp-biodoraia. O trabalho desta conversa acrescenta autoria visual e melhora a importação de avaliações; a cópia da conta Alissomberg serve para transportar o projeto.

## Implementado

- Área do professor → Criar avaliação: editor visual, rascunhos locais separados por UID, duplicação, exclusão e reordenação de questões, revisão, exportação CSV e publicação pelo repositório existente.
- Até 30 questões por simulado; diagnósticos inicial/final exigem 25 questões e têm prazo máximo de 90 minutos. A entrega não tem espera mínima. Simulados permitem tempos próprios até 360 minutos.
- Exatamente cinco alternativas A a E. A coluna alternativa_f permanece vazia por compatibilidade.
- Ano e número original são opcionais para questões autorais. Quando preenchidos: ano 2009–2026 e número 1–200. Fase atual: 1.
- Upload de imagens com prévia e remoção, otimização em WebP e incorporação ao Firestore/CSV, sem exigir hospedagem externa. Entradas até 10 MB e 40 megapixels; o CSV total aceita até 2 MB. Não foi provisionado Storage.
- Explicação e gabarito aparecem ao aluno no relatório depois da entrega, não após cada resposta.
- Importação CSV permanece secundária. Erros mostram coluna, linha, campo vazio ou contagem de caracteres. Textos inválidos podem ser abertos no editor para correção sem truncamento automático.
- Pacote ZIP contém modelo.csv, REGRAS-DE-IMPORTACAO.txt e PROMPT-PARA-IA.txt. Professor escolhe tipo e quantidade antes de baixar. Padrão: simulado com 10 questões; esse padrão não é o limite.
- Caminho do seletor: Área do professor → Criar avaliação → selecionar “Importar CSV” → “Modelo com regras e instruções para a IA”.
- Figuras não extraídas pela IA: imagem_url vazio e marcador [IMAGEM_PENDENTE] nas observações, com referência da figura. Abrir no editor, anexar a figura do documento original e revisar. A publicação fica bloqueada enquanto faltar a imagem marcada.
- A importação não inventa imagens, fontes nem respostas. Avaliações devem passar por revisão humana.

## Correção do loop de refresh

O sanitizador do arquivo routeTree.gen.js regravava o arquivo enquanto o gerador TanStack restaurava o rodapé TypeScript, causando recarregamentos contínuos. O tratamento agora ocorre apenas em memória no plugin frontend/config/javascript-route-tree.js. O mesmo tratamento foi conectado ao scanner Rolldown de dependências em frontend/vite.config.js para permitir partida com cache frio. Não volte a sanitizar o arquivo gerado em disco por watchers. O arquivo gerado pode conter rodapé de tipos; os plugins o removem antes de interpretar o JavaScript.

## Executar na nova máquina

1. Instalar Node.js (backend declara Node 22) e npm. O ambiente anterior usava também Node 26 via NVM para desenvolvimento.
2. Clonar a cópia privada, selecionar feat/mvp-biodoraia e executar npm ci.
3. Copiar frontend/.env.example para frontend/.env.local e preencher as variáveis Firebase/App Check/Gemini. O arquivo .env usado anteriormente NÃO está versionado e deve ser transferido por um meio privado ou recriado.
4. Executar: npm run dev --workspace olympic-school-frontend -- --host 0.0.0.0
5. Ver a porta exibida pelo Vite; no ambiente anterior era http://localhost:8080.
6. Entrar com uma conta Google autorizada e com custom claim teacher para acessar a área do professor. Nenhuma credencial Git/GitHub deve ser incluída em arquivos.

## Verificações realizadas

- Última suíte completa: 66 testes aprovados, build de produção concluído e lint sem erros, com oito avisos preexistentes de Fast Refresh.
- Testes de navegador com Firebase simulado verificaram editor, upload, CSV, ZIP, correção de importação, bloqueio de imagem pendente e layout móvel. Não representam publicação em produção.
- A correção adicional do scanner de dependências passou pelos três testes do plugin; servidor iniciou e /auth respondeu HTTP 200. Essa última alteração não teve uma nova suíte completa/build nesta conversa.
- O loop de refresh foi testado anteriormente mantendo /auth aberta e adicionando/removendo uma rota temporária; os testes temporários e mocks foram removidos do projeto.

## Pendências e limites importantes

- [x] Atualizar o pacote de importação para que a IA externa reconheça as figuras no documento original da prova (PDF, DOCX ou outro formato legível), associe às questões e incorpore WebP em Base64 em `imagem_url`. O marcador `[IMAGEM_PENDENTE]` indica figuras que ainda precisam ser anexadas.

- NÃO houve deploy do frontend nem das regras/índices ajustados do Firebase. Para publicar imagens incorporadas e questões sem origem em produção, implantar backend/firestore.rules e backend/firestore.indexes.json após configurar autenticação administrativa e revisar o destino.
- Cadastrar simulados está implementado, mas a realização pelos alunos ainda não: /app/diagnostic fixa diagnostico_inicial; startAssessment aceita somente diagnostico_inicial e diagnostico_final. Diagnóstico final não possui fluxo liberado na interface.
- Tentativas usam usuário + tipo, sem distinguir código/versão da avaliação; revisar antes de implementar vários simulados/tentativas.
- Plano de estudos e treino adaptativo aparecem como futuros na interface, apesar de haver lógica antiga no domínio e descrições mais amplas no README.
- Rascunhos do editor ficam no navegador: não viajam com o Git. Exportar CSV ou transferir o conteúdo necessário antes de abandonar a máquina.
- Não confundir a cópia privada de transporte com o remoto original conectado ao Lovable. Nenhum push ao remoto original foi solicitado nesta etapa.

## Arquivos centrais

- frontend/src/components/teacher/teacher-dashboard.jsx
- frontend/src/components/teacher/assessment-editor.jsx
- frontend/src/components/teacher/assessment-import-help.jsx
- frontend/src/domain/assessment-editor.js
- frontend/src/domain/assessment-image.js
- frontend/src/services/assessment-spreadsheet.js
- frontend/src/services/assessment-import-kit.js
- frontend/src/services/assessment-image-upload.js
- frontend/config/javascript-route-tree.js
- frontend/vite.config.js
- backend/functions/index.js e assessment-logic.js
- backend/firestore.rules e firestore.indexes.json
- docs/editor-avaliacoes.md

## Mensagem para iniciar o próximo chat

“Leia AGENTS.md, docs/CONTEXTO-PARA-CONTINUAR.md e docs/editor-avaliacoes.md. Inspecione o estado do Git e preserve as alterações. Estamos trabalhando no editor de avaliações e na importação assistida por IA. Não faça deploy nem reescreva histórico sem instrução. Continue a partir do estado registrado e aguarde minha próxima tarefa.”
