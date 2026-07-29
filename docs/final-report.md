# Relatório final do MVP

## Implementado

- Firebase Web SDK e configuração por ambiente.
- Google Authentication, perfil, logout e proteção de rotas.
- Firestore nomeado com regras, índices, perfis, chat, mensagens, planos e artefatos.
- Firebase AI Logic real com sete modos, streaming, limites, erros amigáveis e correção JSON.
- Validação e envio privado de PDF, TXT e Markdown.
- Diagnóstico, treino, progresso, planos, notebooks e artefatos.
- Testes unitários do domínio e suíte de regras para o Emulator Suite.

## Não concluído por dependência externa

- Bucket do Storage: criação recusada até ativação do plano Blaze.
- App Check enforcement: depende da chave reCAPTCHA Enterprise e do domínio de produção.
- Persistência confiável dos agregados de progresso: depende de backend confiável.
- Execução local dos testes de regras: depende de Java 21.

## Estrutura e variáveis

A estrutura do banco e todas as variáveis estão em `README.md` e `docs/firebase-setup.md`.
`.env.local` contém apenas configuração pública do app Web e não é versionado.

## Validação executada

- `npm run lint`: aprovado, sem erros.
- `npm run test`: 8 testes aprovados.
- `npm run build`: aprovado (cliente, SSR e worker).
- compilação e deploy das regras/índices do Firestore: aprovado.
- deploy do Google Authentication: aprovado.
- chamada real ao Firebase AI Logic / Gemini: aprovada.
- `npm run test:rules`: suíte criada; execução bloqueada pela ausência de Java.
- deploy do Storage: bloqueado porque o bucket ainda não foi provisionado.

## Próximos passos

1. Ativar Blaze e criar o bucket.
2. Configurar App Check com o domínio final.
3. Criar backend confiável para validar tentativas e atualizar domínio.
4. Instalar Java 21 no ambiente de CI e tornar `test:rules` obrigatório.
5. Fazer validação manual de login e responsividade no domínio publicado.
