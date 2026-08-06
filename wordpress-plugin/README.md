# Olympic School para WordPress

Plugin funcional da área autenticada da Olympic School. O WordPress controla a landing page e as páginas institucionais; o plugin fornece autenticação, aprendizagem adaptativa, assistente e gestão docente, mantendo Firebase Authentication, Firestore, App Check e Firebase AI Logic como backend.

## Funcionalidades disponíveis

- login e logout com Google;
- criação e conclusão do perfil do estudante;
- painel com indicadores da conta;
- diagnóstico de até 15 questões e domínio por habilidade;
- treino adaptativo por domínio, erros, tempo e prioridades do plano;
- progresso, tentativas e eventos persistidos;
- criação, conclusão e exclusão de planos de estudo;
- biblioteca de notebooks externos;
- artefatos privados de estudo;
- assistente com streaming, oito focos pedagógicos e anexos PDF/TXT/Markdown;
- histórico, renomeação, limpeza e exportação de conversas;
- painel docente para questões, notebooks e prompts;
- App Check e isolamento dos dados por UID;
- API pública `window.OlympicSchool` para extensões futuras.

## Shortcodes

Aplicação completa, com navegação interna:

```text
[olympic_school_app]
```

Aplicação iniciando em uma área específica:

```text
[olympic_school_app view="assistant"]
```

Shortcodes individuais:

```text
[olympic_school_login]
[olympic_school_dashboard]
[olympic_school_diagnostic]
[olympic_school_training]
[olympic_school_progress]
[olympic_school_plans]
[olympic_school_notebooks]
[olympic_school_artifacts]
[olympic_school_assistant]
[olympic_school_teacher]
```

Para esconder a navegação interna e usar somente o menu do WordPress:

```text
[olympic_school_diagnostic navigation="no"]
```

Consulte [`docs/wordpress-plugin-pages.md`](../docs/wordpress-plugin-pages.md) para o passo a passo completo.

## Instalar ou atualizar

1. Compacte o conteúdo desta pasta como `olympic-school.zip`, mantendo `src/`, `includes/`, `olympic-school.php` e `index.php` na raiz do ZIP.
2. No WordPress, abra **Plugins → Adicionar plugin → Enviar plugin**.
3. Se já houver uma versão instalada, confirme **Substituir atual pela enviada**.
4. Ative o plugin.
5. Abra **Configurações → Olympic School** e salve a configuração pública do aplicativo Firebase Web.
6. Adicione o domínio final ao Firebase Authentication e ao App Check antes de ativar enforcement.
7. Para usar a área docente, publique as regras Firestore desta branch e conceda a custom claim `teacher` conforme o manual.

Não coloque senhas, service accounts, chaves privadas ou tokens pessoais nos campos do plugin.

## Desenvolvimento e validação

```powershell
npm.cmd test
npm.cmd run check
```

As integrações externas ainda precisam de teste manual no WordPress com o projeto Firebase real.
