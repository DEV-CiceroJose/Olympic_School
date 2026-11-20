# Configuração Firebase

## Recursos provisionados

- Projeto `biodoraia` e app Web `Olympic School Web`.
- Firestore Enterprise em modo Native, banco `biodoraia`, região `southamerica-east1`.
- Google Sign-In implantado com Firebase CLI.
- Firebase AI Logic habilitado para o app Web, usando Gemini Developer API.
- App Check configurado com reCAPTCHA Enterprise.
- Regras e índices do Firestore publicados.

Os arquivos operacionais ficam em `backend/`. Os adaptadores usados pela interface ficam em
`frontend/src/services/`.

## Operação gratuita

- O modelo `gemini-3.6-flash` funciona pela Gemini Developer API sem plano Blaze, dentro das cotas
  gratuitas.
- Anexos são enviados como conteúdo inline para a IA e não usam Firebase Storage.
- Não há Cloud Functions ou outros recursos que exijam faturamento.

## App Check no Gemini

O frontend inicializa o App Check com reCAPTCHA Enterprise no navegador antes de criar o serviço
Firebase AI Logic. A chave `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` é pública e deve estar presente no
ambiente de build. A configuração do app Web precisa apontar para o mesmo projeto e app registrados
em **Firebase Console → App Check → Apps**.

1. No projeto `biodoraia`, confirme que o app Web está registrado com a chave reCAPTCHA Enterprise
   usada pelo build. Na chave reCAPTCHA, confirme a autorização do domínio publicado
   `olympicschool.onrender.com` e do domínio de homologação, se houver.
2. Em **App Check → APIs → Firebase AI Logic**, confira se a proteção básica está como **Enforced**.
   O Firebase passou a aplicá-la automaticamente em 2 de novembro de 2026. Consulte
   [App Check para Firebase AI Logic](https://firebase.google.com/docs/ai-logic/app-check).
3. Antes da correção, entre em [Olympic School](https://olympicschool.onrender.com/chat). Abra a aba
   **Rede** do navegador, envie “Explique mitose em uma frase” e filtre por
   `firebasevertexai.googleapis.com`. Anote o status HTTP e se o cabeçalho de solicitação
   `X-Firebase-AppCheck` aparece. Registre apenas a presença do cabeçalho.
4. Repita no ambiente corrigido com o mesmo texto. Confira o cabeçalho, a resposta bem-sucedida e
   o texto chegando progressivamente. Teste também o modo **Correção discursiva** com uma resposta
   curta e confira se ele exibe a pontuação e a explicação. Compare com as métricas de solicitações
   verificadas do Firebase AI Logic no console.

Para rodar localmente, preencha `frontend/.env.local` com os valores do app Web, incluindo a chave
pública reCAPTCHA, configure `VITE_FIREBASE_APPCHECK_DEBUG=true` e execute `npm run dev`. Abra
`http://localhost:8080`. O login com Google exige que o host usado no navegador esteja listado em
**Authentication → Configurações → Domínios autorizados**. Use `localhost`, que já consta no
projeto `biodoraia`. Se o servidor já estava rodando quando você editou o `.env.local`, encerre
o processo do Vite e execute `npm run dev` novamente. O Firebase imprime no console
do navegador um token de depuração. Cadastre-o em **App Check → Apps → Gerenciar tokens de
depuração**, recarregue a página e repita o teste. Trate o token como uma credencial privada.
A opção de depuração funciona apenas no servidor de desenvolvimento acessado por loopback.
Veja a [documentação do modo de depuração](https://firebase.google.com/docs/app-check/web/debug-provider).

Se `exchangeDebugToken` responder HTTP 403, confira se o token desse navegador está
cadastrado no app Web correto. Se a geração responder HTTP 500, consulte o campo
`error.message` na aba **Resposta** da requisição de geração e confirme se o cabeçalho
`X-Firebase-AppCheck` foi enviado. Registre apenas a presença do cabeçalho e a mensagem
de erro. Revogue o token de depuração quando terminar os testes.

## Deploy

Execute na raiz:

```sh
npm run firebase:use
npm run firebase:deploy:auth
npm run firebase:deploy:firestore
```

## Modelo de dados

```text
users/{uid}
users/{uid}/conversations/{conversationId}
users/{uid}/conversations/{conversationId}/messages/{messageId}
users/{uid}/attempts/{attemptId}
users/{uid}/skillMastery/{skillId}
users/{uid}/studyPlans/{planId}
users/{uid}/progressEvents/{eventId}
users/{uid}/artifacts/{artifactId}
skills/{skillId}
questions/{questionId}
notebooks/{notebookId}
externalNotebooks/{notebookId}
```

Artefatos ficam sob `users/{uid}` em vez de uma coleção global, eliminando a necessidade de confiar
em um `ownerId` fornecido pelo navegador.

## Segurança

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be
secure for authenticated, owner-scoped student records, immutable attempts, validated private
progress aggregates, bounded fields, and deny-by-default access. However, you should review and
verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
