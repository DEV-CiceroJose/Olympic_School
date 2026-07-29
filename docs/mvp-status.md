# Status de implementação do MVP

Data: 2026-07-29

## Implementado

- Repositório conectado a `DEV-CiceroJose/BiodoraIA`.
- Estrutura separada em `frontend/` e `backend/`.
- Login Google, perfil individual, logout e rotas protegidas.
- Indicador real do usuário no assistente e na área de estudos.
- Seletor superior entre os modos Assistente e Tutor.
- Firebase AI Logic com Gemini, streaming e ferramentas de estudo.
- Conversas, mensagens, planos e artefatos privados no Firestore.
- Diagnóstico, treino adaptativo, domínio por habilidade e progresso sincronizados no Firestore.
- Migração automática da persistência local anterior e cache de recuperação.
- App Check com reCAPTCHA Enterprise.
- Anexos inline para IA sem Firebase Storage ou plano Blaze.
- Regras com isolamento por usuário, validação de esquema e bloqueio por padrão.

## Limitações conhecidas

- Anexos não são armazenados após a sessão.
- Notebooks externos são um catálogo somente leitura.
- Cotas gratuitas da IA são limitadas.
- O enforcement do App Check deve ser ativado gradualmente no domínio publicado.

## Validação

- Login, navegação e uso principal validados manualmente.
- Lint sem erros.
- TypeScript aprovado com `tsc --noEmit`.
- Testes essenciais aprovados.
- Build de produção aprovado.
- Regras do Firestore compiladas e auditadas antes do deploy.
