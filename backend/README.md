# Backend

O backend da Olympic School usa serviços gerenciados do Firebase, sem manter um servidor Node próprio.

## Responsabilidades

- `firebase.json`: configuração dos serviços e emuladores.
- `.firebaserc`: associação com o projeto `biodoraia`.
- `firestore.rules`: autorização, isolamento e validação dos dados.
- `firestore.indexes.json`: índices necessários às consultas do frontend.
- `scripts/set-teacher-claim.mjs`: concessão ou remoção segura do perfil docente.

Authentication, Firestore, App Check e Firebase AI Logic são executados pela infraestrutura do
Firebase. O frontend acessa esses serviços pelos adaptadores em `frontend/src/services`.

## Comandos

Execute na raiz do repositório:

```sh
npm run firebase:use
npm run firebase:deploy:auth
npm run firebase:deploy:firestore
```

Os comandos usam sempre a versão mais recente da Firebase CLI via `npx`.

## Acesso de professor

A área `/app/teacher` exige a custom claim booleana `teacher: true`. Instale a Google Cloud CLI,
execute `gcloud auth application-default login` com uma conta que tenha a permissão
`firebaseauth.users.update` e, na raiz, use:

```sh
npm run teacher:set-claim -- professor@escola.com true
```

Para revogar, substitua `true` por `false`. Depois da mudança, a pessoa precisa sair e entrar de novo.
O script usa a API Identity Platform com um token temporário das credenciais locais. As regras do
Firestore verificam a mesma claim antes de aceitar gravações em `questions`, `externalNotebooks` e
`promptPresets`.

## Diagnóstico no Cloudflare Workers Free

O Worker em `assessment-worker/` usa Firebase Authentication e o Firestore existente
para iniciar tentativas, salvar respostas e gerar o relatório no servidor. O
agendamento confere tentativas vencidas a cada cinco minutos. As regras do
Firestore continuam bloqueando gravações diretas de alunos em tentativas e
acesso aos gabaritos.

Para publicar, use o Wrangler no diretório `backend/assessment-worker`.
Configure `ALLOWED_ORIGINS` com as origens exatas do frontend. Cadastre
`GOOGLE_CLIENT_EMAIL` e `GOOGLE_PRIVATE_KEY` como segredos do Worker. Use uma
conta de serviço dedicada com acesso de leitura, criação e atualização de
documentos no banco nomeado `biodoraia`. A credencial fica apenas no servidor.

Após o deploy, informe a URL do Worker em `VITE_ASSESSMENT_API_URL` no frontend.
Sem essa variável, o frontend usa as Cloud Functions do Firebase. Reinicie o
servidor local ou gere um novo build do frontend após atualizar o valor.
