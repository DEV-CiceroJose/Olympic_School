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

## Estado da migração

O plugin 0.4.0 contém as camadas de serviços e as interfaces em JavaScript sem React. As páginas podem usar a aplicação completa ou shortcodes individuais para painel, diagnóstico, treino, progresso, planos, notebooks, artefatos, assistente e gestão docente.

Uma funcionalidade só deve ser considerada validada em produção depois de um teste manual no domínio final com Authentication, Firestore, App Check e Firebase AI Logic reais. Os testes automatizados não substituem essa validação externa.

## Segurança operacional

- não versionar credenciais privadas;
- não usar service account no navegador;
- manter App Check sem enforcement durante o primeiro teste no novo domínio;
- revisar domínios autorizados do Google Sign-In;
- ativar enforcement somente após login, Firestore e IA passarem no domínio final;
- preservar as regras `backend/firestore.rules` como fonte de verdade.

## Interfaces fornecidas

1. sessão, login e perfil;
2. visão geral;
3. diagnóstico;
4. treino adaptativo;
5. progresso;
6. planos;
7. notebooks;
8. artefatos;
9. assistente e histórico;
10. gestão docente.

Consulte `docs/wordpress-plugin-pages.md` para montar as páginas no Editor de Blocos.
