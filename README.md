# Olympic School

MVP de treinamento adaptativo para estudantes que se preparam para olimpíadas científicas de
Biologia. A plataforma transforma respostas reais em um mapa de domínio por habilidade, seleciona
a próxima atividade e acompanha lacunas sem permitir que a IA invente progresso.

> Status: Firebase Authentication, Firestore, App Check e Firebase AI Logic estão integrados ao
> projeto `biodoraia`, sem exigir plano Blaze.

## Funcionalidades

- landing page responsiva preservada;
- Login Google real, perfil com nome e turma, logout e rotas protegidas;
- chat com Firebase AI Logic, modelo configurável e focos predefinidos;
- assistente, tutor, resumo, questões, flashcards, mapa mental, plano e correção discursiva estruturada;
- histórico de conversas e mensagens persistido no Firestore;
- correção discursiva assistida por IA com saída JSON estruturada;
- diagnóstico inicial com 15 questões e resultado por habilidade;
- cálculo determinístico de domínio entre 0 e 100;
- treino adaptativo por domínio, erros recentes, tempo de resposta e prioridades do plano;
- planos e artefatos privados persistidos por usuário;
- notebooks externos claramente identificados como não sincronizados;
- anexos PDF, TXT e Markdown enviados diretamente à IA na sessão, sem bucket pago;
- regras de segurança com isolamento por `request.auth.uid`.
- cache local isolado por UID, sem reutilização automática entre contas;
- histórico paginado, carregado sob demanda, com renomeação, limpeza e exportação Markdown.
- área exclusiva do professor para gerenciar questões, notebooks e prompts dos focos da IA;
- autorização docente em duas camadas: custom claim `teacher` e regras do Firestore.

## Desenvolvimento

Requisitos:

- Node.js 20 ou superior;
- npm 11 ou superior;

```sh
cp frontend/.env.example frontend/.env.local
npm install
npm run dev
```

Validação:

```sh
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

Os testes usam uma configuração Firebase local não roteável quando as variáveis `VITE_*` não estão
presentes. Operações reais de login, Firestore, App Check e IA continuam bloqueadas até que o
ambiente seja configurado.

## Variáveis de ambiente

O arquivo `frontend/.env.local` é ignorado pelo Git. Preencha:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIRESTORE_DATABASE_ID=biodoraia
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=
VITE_GEMINI_MODEL=gemini-3.6-flash
```

As chaves do SDK Web identificam o app, mas não são segredos de servidor. A autorização é
garantida pelo Firebase Authentication, Security Rules e, quando ativado, App Check.

## Firebase

- projeto: `biodoraia`;
- app Web: `Olympic School Web`;
- Firestore Enterprise / Native mode: banco nomeado `biodoraia`;
- região: `southamerica-east1`;
- Authentication: provedor Google habilitado;
- Firebase AI Logic: Gemini Developer API habilitada;
- modelo padrão: `gemini-3.6-flash`.
- App Check: reCAPTCHA Enterprise configurado, sem enforcement durante a validação inicial.

Deploy:

```sh
npm run firebase:deploy:auth
npm run firebase:deploy:firestore
```

Para conceder acesso à área do professor, instale a Google Cloud CLI, autentique as credenciais
locais (`gcloud auth application-default login`) com uma conta autorizada e execute:

```sh
npm run teacher:set-claim -- professor@escola.com true
```

Use `false` no último argumento para remover o acesso. A pessoa deve sair e entrar novamente depois
da alteração para renovar o token. O comando usa a API administrativa oficial e não grava a
credencial no projeto.

O build gera um worker compatível com Cloudflare. Para publicar depois de autenticar o Wrangler:

```sh
npm run deploy:cloudflare
```

O `gemini-3.6-flash` está disponível na Gemini Developer API sem exigir faturamento, respeitando as
cotas gratuitas do serviço. A aplicação não provisiona Firebase Storage para evitar a exigência de
plano Blaze em projetos novos.

## Estrutura do repositório

```text
Olympic_School/
├── frontend/             aplicação React/TanStack
│   ├── src/components/   interface
│   ├── src/routes/       páginas e layouts
│   ├── src/domain/       aprendizagem determinística
│   └── src/services/     adaptadores Firebase e IA
├── backend/              configuração do backend gerenciado
│   ├── firebase.json
│   ├── firestore.rules
│   └── firestore.indexes.json
├── wordpress-plugin/     aplicação autenticada para páginas WordPress
│   ├── includes/         integração PHP, configurações e shortcodes
│   └── src/              Firebase, domínio, serviços e interfaces sem React
├── docs/                 relatórios e documentação
└── package.json          comandos unificados do workspace
```

Não existe um servidor pago escondido no frontend. O diretório `backend/` concentra configuração,
autorização e deploy dos serviços gerenciados do Firebase. Consulte
[frontend/README.md](./frontend/README.md) e [backend/README.md](./backend/README.md).

## WordPress

A landing page, navbar e páginas institucionais são construídas no Editor de Blocos. A área
autenticada é fornecida pelo plugin em `wordpress-plugin/`, que preserva o mesmo backend Firebase e
expõe a aplicação completa por `[olympic_school_app]` ou por shortcodes individuais. Consulte
[docs/wordpress-plugin-pages.md](./docs/wordpress-plugin-pages.md) para instalar e montar as páginas.

## Rotas

| Rota                    | Função                     |
| ----------------------- | -------------------------- |
| `/`                     | Landing page               |
| `/auth`                 | Login Google e perfil      |
| `/app`                  | Visão geral da trilha      |
| `/app/diagnostic`       | Diagnóstico de 15 questões |
| `/app/training`         | Treino adaptativo          |
| `/app/progress`         | Progresso por habilidade   |
| `/app/plans`            | Planos persistidos         |
| `/app/notebooks`        | Links externos             |
| `/app/artifacts`        | Materiais persistidos      |
| `/app/teacher`          | Gestão exclusiva docente   |
| `/chat`                 | Assistente com Gemini      |
| `/chat/:conversationId` | Histórico de uma conversa  |

## Limitações conhecidas

- cotas gratuitas da IA não são ilimitadas; quando atingidas, a interface pede para aguardar;
- anexos são mantidos somente durante a conversa atual e não ficam armazenados após recarregar;
- o enforcement do App Check só deve ser ligado depois da validação no domínio publicado;
- tentativas, domínio e eventos são sincronizados na área privada do usuário no Firestore e mantêm
  uma cópia local de recuperação separada por UID;
- links específicos dos notebooks ainda dependem de cadastro pela equipe;
- a listagem inicial mostra as 30 conversas mais recentes e cada conversa carrega até 100 mensagens;

Veja [docs/firebase-setup.md](./docs/firebase-setup.md),
[docs/security-audit.json](./docs/security-audit.json) e
[docs/final-report.md](./docs/final-report.md). Antes de publicar, siga
[docs/production-checklist.md](./docs/production-checklist.md).
