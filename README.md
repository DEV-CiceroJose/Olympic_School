# BiodoraIA

MVP de treinamento adaptativo para estudantes que se preparam para olimpíadas científicas de Biologia. A plataforma transforma respostas reais em um mapa de domínio por habilidade, seleciona a próxima atividade e acompanha lacunas sem permitir que a IA invente progresso.

> Status: núcleo local de aprendizagem implementado. Firebase Authentication, Firestore, Storage, App Check e Firebase AI Logic ainda aguardam o provisionamento de um projeto Firebase próprio.

## Funcionalidades disponíveis

- landing page responsiva preservada do frontend original;
- diagnóstico inicial com 15 questões de Biologia;
- resultado por habilidade, além da porcentagem geral;
- cálculo determinístico de domínio entre 0 e 100;
- treino adaptativo orientado pela habilidade com menor domínio;
- progresso com quantidade de tentativas, acertos e confiança da medição;
- interface de chat existente com serviços simulados;
- persistência local temporária para diagnóstico e treino;
- testes unitários do motor de aprendizagem.

## Desenvolvimento

Requisitos:

- Node.js 20 ou superior;
- npm 11 ou superior.

```sh
npm install
npm run dev
```

Validação completa:

```sh
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

## Rotas

| Rota                    | Função                     |
| ----------------------- | -------------------------- |
| `/`                     | Landing page               |
| `/auth`                 | Protótipo do acesso Google |
| `/app`                  | Visão geral da trilha      |
| `/app/diagnostic`       | Diagnóstico de 15 questões |
| `/app/training`         | Treino adaptativo          |
| `/app/progress`         | Progresso por habilidade   |
| `/chat`                 | Interface do assistente    |
| `/chat/:conversationId` | Conversa existente         |

## Arquitetura

- TanStack Start com rotas de arquivo;
- React 19 e TypeScript;
- Vite 8 e Tailwind CSS 4;
- domínio de aprendizagem puro em `src/domain/learning.ts`;
- catálogo inicial em `src/data/diagnostic-questions.ts`;
- persistência temporária encapsulada por `src/services/learning-repository.ts`.

`src/routeTree.gen.ts` é gerado automaticamente. Não edite esse arquivo manualmente.

## Firebase pendente

Ainda não existe um projeto Firebase da BiodoraIA na conta consultada. Quando o projeto for escolhido ou criado, o frontend deverá receber, por meio de um arquivo `.env.local` não versionado:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_APP_CHECK_SITE_KEY=
VITE_FIREBASE_AI_MODEL=
```

As chaves públicas de configuração do SDK Web não substituem as regras de autorização. Dados privados deverão ser protegidos por Firebase Authentication, Security Rules e App Check.

## Limitações atuais

- login Google ainda é simulado;
- dados de aprendizagem ficam somente no navegador atual;
- chat usa respostas simuladas por padrão;
- uploads não são enviados ao Firebase Storage;
- notebooks externos, planos e artefatos ainda não estão persistidos;
- Firebase AI Logic ainda não está provisionado;
- não houve validação visual automatizada porque o navegador interno não conseguiu acessar o perfil local do Windows.

Leia [SPEC.md](./SPEC.md) para o escopo completo e [docs/initial-inspection.md](./docs/initial-inspection.md) para o inventário do frontend recebido.
