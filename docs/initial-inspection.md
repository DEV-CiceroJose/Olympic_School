# Relatório de inspeção inicial

Data: 2026-07-29

## Baseline encontrado

- Framework: TanStack Start com React 19, TypeScript 5.8 e Vite 8.
- Estilos: Tailwind CSS 4, componentes Radix UI e identidade visual própria da Olympic School.
- Package manager do artefato: Bun (`bun.lock`), porém Bun não está instalado neste ambiente; a validação local usa npm.
- Rotas existentes: `/`, `/auth`, `/chat` e `/chat/:conversationId`.
- Componentes principais: landing page, fluxo visual de login, sidebar, composer, histórico e mensagens do chat.
- Serviços existentes: assistente, conversas, arquivos e notebooks, todos com mocks ou API externa opcional.
- Scripts disponíveis: `dev`, `build`, `build:dev`, `preview`, `lint` e `format`.
- Variáveis de ambiente existentes: nenhuma.
- Testes existentes: nenhum script ou suíte de testes.

## Git e pacote de origem

- O diretório continha somente `biodoraia-frontend.zip`.
- O ZIP foi listado antes da extração e permanece preservado, fora do versionamento.
- O ponteiro Git exportado pelo Lovable referenciava um caminho temporário inválido; ele foi redirecionado para o metadado local recuperado.
- O remote atual aponta para `https://github.com/DEV-CiceroJose/Olympic_School.git`.
- O repositório remoto está vazio, sem branches ou commits.

## Riscos de integração

- Autenticação, conversas, arquivos e respostas da IA são simulados.
- Ainda não existe projeto Firebase da Olympic School na conta autenticada.
- Firestore, Storage, App Check e AI Logic não estão provisionados.
- Não há testes automatizados nem emuladores configurados.
- O frontend usa rotas de arquivo do TanStack Start; `frontend/src/routeTree.gen.ts` deve continuar
  sendo gerado, nunca editado manualmente.
- O pacote de origem usa Bun, mas o ambiente atual dispõe apenas de npm.

## Arquivos preservados

Serão preservados a landing page, identidade visual, componentes Radix, imagens, tipografia, animações, estrutura de navegação e o ZIP original. A implementação deverá adaptar os serviços e acrescentar os fluxos de aprendizagem sem substituir o frontend por um template genérico.
