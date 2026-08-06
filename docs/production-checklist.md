# Checklist de produção

Use este checklist no domínio definitivo. As etapas alteram recursos externos e não são executadas
automaticamente pelo repositório.

## Configuração

- preencher `frontend/.env.local` com a configuração pública do app Web;
- confirmar que `VITE_FIRESTORE_DATABASE_ID` aponta para `biodoraia`;
- cadastrar o domínio em Firebase Authentication;
- cadastrar a chave reCAPTCHA Enterprise em `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`;
- autenticar Firebase CLI e Wrangler somente no ambiente de deploy.
- conceder a claim `teacher: true` somente às contas docentes autorizadas.

## Validação antes do enforcement

1. Publicar em um domínio de homologação.
2. Validar login, perfil, logout e rotas protegidas.
3. Criar, renomear, exportar e limpar uma conversa.
4. Testar cada foco da IA, inclusive correção discursiva e anexos.
5. Concluir diagnóstico, treino, progresso e plano com duas contas diferentes no mesmo navegador.
6. Conferir no painel App Check que as solicitações válidas recebem token.
7. Ativar enforcement gradualmente para Firestore e Firebase AI Logic.
8. Repetir os fluxos e acompanhar rejeições antes de ampliar o acesso.
9. Com uma conta docente, cadastrar uma questão, um notebook e editar um prompt; confirmar que uma
   conta de estudante não vê a aba e recebe permissão negada ao tentar gravar diretamente.

## Comandos locais

```sh
npm ci
npm run lint
npm run test
npm run build
npm audit
```

## Publicação

```sh
npm run firebase:deploy:auth
npm run firebase:deploy:firestore
npm run deploy:cloudflare
```

Não habilite enforcement antes de confirmar o domínio, a chave reCAPTCHA e as métricas de tráfego
válido. Não faça force push nem reescreva o histórico da branch conectada ao Lovable.
