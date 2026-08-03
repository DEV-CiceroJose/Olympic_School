# Migração para o plugin WordPress

## Decisão arquitetural

O Firebase permanece como backend gerenciado. O plugin WordPress passa a ser a camada funcional consumida pelo frontend montado no editor do WordPress. Não será criado um proxy PHP geral nem uma segunda base de dados.

```text
Tema e blocos WordPress
        ↓
window.OlympicSchool (plugin)
        ↓
Firebase Authentication / Firestore / App Check / AI Logic
```

Essa decisão preserva o modelo de dados, as regras publicadas e a gratuidade planejada. Também evita guardar uma service account no WordPress.

## Compatibilidade preservada

- Project ID: `biodoraia`;
- aplicativo Web visível: `Olympic School Web`;
- banco Firestore nomeado: `biodoraia`;
- coleções abaixo de `users/{uid}`;
- modos do assistente e compatibilidade do modo legado `tutor`;
- limite de 12.000 caracteres por entrada;
- limite local de 60 mensagens de IA por sessão;
- anexos inline de até 10 MB;
- chaves locais legadas `biodoraia.learning.*` para recuperar progresso existente.

## Limites da migração

O plugin contém a camada de serviços, mas ainda precisa dos blocos Gutenberg que formarão as telas. Uma funcionalidade só deve ser considerada entregue depois de seu bloco ser construído e validado contra o projeto Firebase real.

## Segurança operacional

- não versionar credenciais privadas;
- não usar service account no navegador;
- manter App Check sem enforcement durante o primeiro teste no novo domínio;
- revisar domínios autorizados do Google Sign-In;
- ativar enforcement somente após login, Firestore e IA passarem no domínio final;
- preservar as regras `backend/firestore.rules` como fonte de verdade.

## Ordem do frontend

1. bloco de sessão/login;
2. bloco de visão geral;
3. bloco de diagnóstico;
4. bloco de treino;
5. bloco de progresso;
6. bloco de planos;
7. bloco de artefatos;
8. bloco do assistente.
