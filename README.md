# BiodoraIA

MVP de treinamento adaptativo para estudantes que se preparam para olimpíadas científicas de
Biologia. A plataforma transforma respostas reais em um mapa de domínio por habilidade, seleciona
a próxima atividade e acompanha lacunas sem permitir que a IA invente progresso.

> Status: Firebase Authentication, Firestore e Firebase AI Logic estão integrados ao projeto
> `biodoraia`. O Storage aguarda a ativação do plano Blaze e o App Check aguarda uma chave
> reCAPTCHA Enterprise vinculada ao domínio de produção.

## Funcionalidades

- landing page responsiva preservada;
- Login Google real, perfil com nome e turma, logout e rotas protegidas;
- chat com Firebase AI Logic e modelo configurável;
- modos tutor, resumo, questões, flashcards, mapa mental, plano e correção;
- histórico de conversas e mensagens persistido no Firestore;
- correção discursiva assistida por IA com saída JSON estruturada;
- diagnóstico inicial com 15 questões e resultado por habilidade;
- cálculo determinístico de domínio entre 0 e 100;
- treino adaptativo e progresso por habilidade;
- planos e artefatos privados persistidos por usuário;
- notebooks externos claramente identificados como não sincronizados;
- upload de PDF, TXT e Markdown (código e regras prontos; bucket pendente);
- regras de segurança com isolamento por `request.auth.uid`.

## Desenvolvimento

Requisitos:

- Node.js 20 ou superior;
- npm 11 ou superior;
- Java 21 para executar o Emulator Suite e `npm run test:rules`.

```sh
cp .env.example .env.local
npm install
npm run dev
```

Validação:

```sh
npm run lint
npm run test
npm run test:rules
npm run build
npm audit --omit=dev
```

## Variáveis de ambiente

O arquivo `.env.local` é ignorado pelo Git. Preencha:

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
VITE_USE_MOCKS=false
```

As chaves do SDK Web identificam o app, mas não são segredos de servidor. A autorização é
garantida pelo Firebase Authentication, Security Rules e, quando ativado, App Check.

## Firebase

- projeto: `biodoraia`;
- app Web: `BiodoraIA Web`;
- Firestore Enterprise / Native mode: banco nomeado `biodoraia`;
- região: `southamerica-east1`;
- Authentication: provedor Google habilitado;
- Firebase AI Logic: Gemini Developer API habilitada;
- modelo padrão: `gemini-3.6-flash`.

Deploy:

```sh
npx -y firebase-tools@latest deploy --only auth --project biodoraia
npx -y firebase-tools@latest deploy --only firestore --project biodoraia
npx -y firebase-tools@latest deploy --only storage --project biodoraia
```

O último comando só funciona depois que o bucket padrão for criado no console em um projeto com
plano Blaze.

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

- o bucket do Storage não pode ser criado no plano atual; uploads estão bloqueados até o upgrade;
- App Check está integrado de forma condicional, mas não é aplicado sem a chave reCAPTCHA;
- tentativas e domínio ainda são calculados localmente; agregados no Firestore são somente leitura
  para o cliente e precisam de uma função confiável antes de sincronizar progresso;
- links específicos dos notebooks ainda dependem de cadastro pela equipe;
- os testes de regras exigem Java, ausente na máquina usada nesta implementação.

Veja [docs/firebase-setup.md](./docs/firebase-setup.md),
[docs/security-audit.json](./docs/security-audit.json) e
[docs/final-report.md](./docs/final-report.md).
