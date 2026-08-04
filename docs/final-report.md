# Relatório final do MVP

## Implementado

- Firebase Web SDK e configuração por ambiente.
- Google Authentication, perfil, logout e proteção de rotas.
- Firestore nomeado com regras, índices, perfis, chat, mensagens, planos e artefatos.
- Firebase AI Logic com focos selecionáveis no composer, ferramentas de estudo, streaming, limites,
  erros amigáveis e correção JSON.
- Focos predefinidos enviados junto à solicitação original: tutor, resumo, questões, flashcards,
  mapa mental, plano de estudos e correção discursiva.
- Validação e envio inline de PDF, TXT e Markdown diretamente à IA, sem armazenamento pago.
- Diagnóstico, treino e progresso sincronizados no Firestore, além de planos, notebooks e artefatos.
- Cache de aprendizagem isolado por UID; o cache legado global não é atribuído automaticamente a
  nenhuma conta.
- Conversas listadas de forma limitada e mensagens carregadas sob demanda.
- App Check com reCAPTCHA Enterprise.
- Testes unitários essenciais do domínio e da integração de prompts.

## Limitações conhecidas

- Anexos existem somente na sessão atual e não são armazenados.
- App Check enforcement aguarda validação no domínio publicado.
- Serviços gratuitos possuem cotas; a interface trata o limite da IA com uma mensagem amigável.

## Estrutura e variáveis

A aplicação está separada em `frontend/` e `backend/`, com comandos unificados na raiz. A estrutura
do banco e todas as variáveis estão em `README.md` e `docs/firebase-setup.md`.
`frontend/.env.local` contém apenas configuração pública do app Web e não é versionado.

## Validação executada

Validação automatizada em 2026-08-04:

- `npm run lint`: aprovado, sem erros e com oito avisos de Fast Refresh.
- `npm run test`: 28 testes aprovados sem credenciais de produção.
- `npm run build`: aprovado para cliente, SSR e worker.
- `npm audit`: nenhuma vulnerabilidade conhecida em produção ou desenvolvimento.

Os registros anteriores informam que regras, Authentication, Gemini e App Check foram publicados.
Essas integrações externas não foram reexecutadas nesta correção e precisam de validação manual no
ambiente Firebase configurado.

## Próximos passos

1. Validar App Check no domínio final e ativar enforcement gradualmente.
2. Fazer validação manual de login e responsividade no domínio publicado.
3. Executar testes de integração com os emuladores do Firebase no pipeline.
