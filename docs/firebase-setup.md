# Configuração Firebase

## Recursos provisionados

- Projeto `biodoraia` e app Web `BiodoraIA Web`.
- Firestore Enterprise em modo Native, banco `biodoraia`, região `southamerica-east1`.
- Google Sign-In implantado com Firebase CLI.
- Firebase AI Logic habilitado para o app Web, usando Gemini Developer API.
- Regras e índices do Firestore publicados.

## Ações manuais restantes

1. Vincular o projeto ao plano Blaze.
2. Em Firebase Console → Storage, criar o bucket padrão
   `biodoraia.firebasestorage.app`.
3. Executar `firebase deploy --only storage --project biodoraia`.
4. Criar uma chave reCAPTCHA Enterprise para os domínios reais.
5. Informar a chave em `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
6. Depois de validar métricas, ativar enforcement do App Check para Firestore, Storage,
   Authentication e AI Logic.

Não ative enforcement antes de publicar uma versão que envie tokens App Check; isso bloquearia
clientes legítimos.

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
users/{uid}/uploads/{uploadId}
skills/{skillId}
questions/{questionId}
notebooks/{notebookId}
externalNotebooks/{notebookId}
```

Artefatos ficam sob `users/{uid}` em vez de uma coleção global, eliminando a necessidade de confiar
em um `ownerId` fornecido pelo navegador.

## Segurança

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be
secure for authenticated, owner-scoped student records, immutable attempts, server-only progress
aggregates, bounded fields, and deny-by-default access. However, you should review and verify them
before broadly sharing your app. If you'd like, I can help you harden these rules.
