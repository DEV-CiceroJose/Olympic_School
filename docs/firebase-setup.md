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
- O reCAPTCHA Enterprise do App Check opera dentro da cota gratuita; o enforcement permanece
  desligado durante a validação inicial.

Depois de validar métricas no domínio publicado, o enforcement pode ser habilitado gradualmente.

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
