## Histórico do protótipo inicial de chat

> Este arquivo descreve a base recebida do Lovable e não representa o estado atual do MVP.
> Consulte `README.md`, `SPEC.md` e `docs/final-report.md` para a implementação vigente.

## BiodoraIA — Interface de Chat (somente frontend)

Somente o cliente de chat. Sem backend, sem banco, sem autenticação, sem chamadas a modelos de IA. A landing atual em `/` permanece intacta.

### Rotas

- `/chat` — interface de chat (estado inicial de boas-vindas).
- `/chat/$conversationId` — conversa selecionada, com mensagens mockadas.
- Ambas com `head()` próprio (título/descrição/og), ocupando 100% da viewport, sem scroll da página.

### Layout (referência do modelo de chat + identidade BiodoraIA)

Fundo escuro da marca, tipografia Outfit/Figtree, cantos arredondados, verde como acento — os mesmos tokens já usados na landing. Nada de cores hardcoded.

1. **Sidebar** (shadcn `Sidebar`, colapsável em ícone no desktop, drawer no mobile)
   - Logo BiodoraIA, botão "Nova conversa" em destaque.
   - Itens "Assistente" e "Meus notebooks".
   - Busca de conversas (filtro local sobre os mocks).
   - Conversas recentes agrupadas por data (Hoje / Ontem / Últimos 7 dias): Revisão de genética, Questões sobre ecologia, Resumo de fisiologia, Plano de estudos para OBB, etc.
   - Rodapé com perfil mockado do estudante e botão de configurações (apenas visual).
   - Botão de recolher/expandir com transição suave.

2. **Cabeçalho da conversa**
   - Nome do assistente + indicador "ativo".
   - Seletor de notebook (dropdown) com: OBB — Biologia Geral, Genética, Ecologia, Fisiologia Humana, Botânica, Zoologia, Simulados.
   - Botão de menu (abre a sidebar no mobile) e botão de opções.

3. **Estado inicial**
   - Marca centralizada, "Como posso ajudar você a estudar Biologia hoje?" + frase curta.
   - Cards de ação rápida: Explique um conteúdo, Crie questões, Faça um resumo, Gere flashcards, Monte um mapa mental, Crie um plano de estudos — ao clicar, preenchem o campo com o prompt sugerido.

4. **Área de mensagens**
   - Scroll independente, auto-scroll, largura máxima central.
   - Mensagem do usuário em balão de alto contraste; resposta do assistente sem balão, renderizada em markdown (títulos, listas, tabelas, código, destaques).
   - Ações por mensagem: copiar, curtir/descurtir, tentar novamente.
   - Estados: enviando, streaming (texto aparecendo palavra por palavra), concluída, erro com "Tentar novamente".

5. **Campo de composição** (fixo embaixo)
   - Textarea expansível, Enter envia / Shift+Enter quebra linha, bloqueio de envio vazio.
   - Botão de anexo (chip visual de arquivo, sem upload real), botão "+", botão de envio com estados desabilitado/carregando/parar.
   - Placeholder: "Pergunte alguma coisa sobre Biologia...".
   - Chip do notebook ativo quando selecionado.

6. **Menu "+"** (popover, com fallback responsivo para não sair da tela)
   - Enviar arquivo, Criar resumo, Gerar questões, Criar flashcards, Criar mapa mental, Criar plano de estudos, Selecionar notebook — cada um com ícone, título, descrição curta, hover e estado selecionado.

### Arquitetura técnica

```text
src/
  components/chat/       sidebar, header, message-list, message-item,
                         composer, plus-menu, notebook-select, welcome
  hooks/                 use-chat-session, use-auto-scroll
  services/              assistantService, conversationService,
                         notebookService, fileService
  mocks/                 conversas, mensagens, notebooks, respostas
  types/                 chat.ts (AssistantMode, ChatMessage, SendMessagePayload...)
  routes/chat.tsx, chat.index.tsx, chat.$conversationId.tsx
```

- Serviços expõem `sendMessage`, `list`, `create`, `upload` etc. Com `VITE_USE_MOCKS=true` (padrão) usam os mocks com streaming simulado, atrasos e erro ocasional; com `false`, ficam prontos para chamar `VITE_API_BASE_URL` via `fetch`. Nenhuma chave/token no frontend.
- Estado da conversa em memória (React state), sem persistência.
- `notebookId` e `mode` já incluídos no payload enviado ao serviço.

### Responsividade e acessibilidade

Desktop com sidebar fixa; tablet/mobile com drawer, composer full-width, popover contido na tela, áreas de toque ≥44px, foco visível, roles/aria adequados na lista de mensagens e no status de carregamento.

### Fora de escopo

Landing (mantida como está), login, cadastro, dashboard, upload real, persistência e qualquer integração com IA.
