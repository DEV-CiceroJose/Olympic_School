# Relatório final do MVP

## Implementado

- Firebase Web SDK e configuração por ambiente.
- Google Authentication, perfil, logout e proteção de rotas.
- Firestore nomeado com regras, índices, perfis, chat, mensagens, planos e artefatos.
- Firebase AI Logic real com seletor superior Assistente/Tutor, ferramentas de estudo, streaming,
  limites, erros amigáveis e correção JSON.
- Validação e envio inline de PDF, TXT e Markdown diretamente à IA, sem armazenamento pago.
- Diagnóstico, treino e progresso sincronizados no Firestore, além de planos, notebooks e artefatos.
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

- `npm run lint`: aprovado, sem erros.
- `npm run typecheck`: aprovado.
- `npm run test`: testes essenciais aprovados.
- `npm run build`: aprovado (cliente, SSR e worker).
- compilação e deploy das regras/índices do Firestore: aprovado.
- deploy do Google Authentication: aprovado.
- chamada real ao Firebase AI Logic / Gemini: aprovada.
- App Check/reCAPTCHA Enterprise: configurado.

## Próximos passos

1. Validar App Check no domínio final e ativar enforcement gradualmente.
2. Fazer validação manual de login e responsividade no domínio publicado.
