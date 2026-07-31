# Olympic School

MVP de treinamento adaptativo para estudantes que se preparam para olimpíadas científicas de
Biologia. A plataforma transforma respostas reais em um mapa de domínio por habilidade, seleciona
a próxima atividade e acompanha lacunas sem permitir que a IA invente progresso.

> Status: Firebase Authentication, Firestore, App Check e Firebase AI Logic estão integrados ao
> projeto `biodoraia`, sem exigir plano Blaze.

## Funcionalidades

- landing page responsiva preservada;
- Login Google real, perfil com nome e turma, logout e rotas protegidas;
- chat com Firebase AI Logic e modelo configurável;
- assistente com resumo, questões, flashcards, mapa mental, plano e correção;
- histórico de conversas e mensagens persistido no Firestore;
- correção discursiva assistida por IA com saída JSON estruturada;
- diagnóstico inicial com 15 questões e resultado por habilidade;
- cálculo determinístico de domínio entre 0 e 100;
- treino adaptativo e progresso por habilidade;
- planos e artefatos privados persistidos por usuário;
- notebooks externos claramente identificados como não sincronizados;
- anexos PDF, TXT e Markdown enviados diretamente à IA na sessão, sem bucket pago;
- regras de segurança com isolamento por `request.auth.uid`.

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

O `gemini-3.6-flash` está disponível na Gemini Developer API sem exigir faturamento, respeitando as
cotas gratuitas do serviço. A aplicação não provisiona Firebase Storage para evitar a exigência de
plano Blaze em projetos novos.

## Estrutura do repositório

```text
BiodoraIA/
├── frontend/             aplicação React/TanStack
│   ├── src/components/   interface
│   ├── src/routes/       páginas e layouts
│   ├── src/domain/       aprendizagem determinística
│   └── src/services/     adaptadores Firebase e IA
├── backend/              configuração do backend gerenciado
│   ├── firebase.json
│   ├── firestore.rules
│   └── firestore.indexes.json
├── docs/                 relatórios e documentação
└── package.json          comandos unificados do workspace
```

Não existe um servidor pago escondido no frontend. O diretório `backend/` concentra configuração,
autorização e deploy dos serviços gerenciados do Firebase. Consulte
[frontend/README.md](./frontend/README.md) e [backend/README.md](./backend/README.md).

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
| `/chat`                 | Assistente com Gemini      |
| `/chat/:conversationId` | Histórico de uma conversa  |

## Limitações conhecidas

- cotas gratuitas da IA não são ilimitadas; quando atingidas, a interface pede para aguardar;
- anexos são mantidos somente durante a conversa atual e não ficam armazenados após recarregar;
- o enforcement do App Check só deve ser ligado depois da validação no domínio publicado;
- tentativas, domínio e eventos são sincronizados na área privada do usuário no Firestore e mantêm
  uma cópia local de recuperação;
- links específicos dos notebooks ainda dependem de cadastro pela equipe;

Veja [docs/firebase-setup.md](./docs/firebase-setup.md),
[docs/security-audit.json](./docs/security-audit.json) e
[docs/final-report.md](./docs/final-report.md).
