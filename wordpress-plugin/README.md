# Olympic School para WordPress

Plugin WordPress que migra progressivamente a área autenticada da Olympic School para um frontend próprio do WordPress, mantendo Firebase Authentication, Firestore, App Check e Firebase AI Logic como backend gerenciado.

## Estado da migração do núcleo

- shortcode `[olympic_school_app]`;
- tela de configuração no painel do WordPress;
- inicialização isolada do aplicativo Firebase;
- App Check com reCAPTCHA Enterprise quando configurado;
- login e logout com Google;
- criação e conclusão do perfil do estudante em `users/{uid}`;
- repositório de conversas e mensagens, incluindo renomear, limpar e exportar;
- repositórios de tentativas, domínio, eventos, planos e artefatos;
- geração determinística de domínio e planos;
- anexos PDF, TXT e Markdown processados somente no navegador;
- Firebase AI Logic com streaming, modos do assistente e correção discursiva;
- API JavaScript pública para os futuros blocos WordPress;
- painel-base responsivo sem React.

As camadas de dados e regras foram migradas, mas Diagnóstico, Treino, Progresso, Planos, Artefatos e Assistente ainda não possuem blocos Gutenberg próprios. O frontend React atual continua sendo a referência visual até cada tela ser construída e validada no WordPress.

## API para o frontend WordPress

Quando o shortcode carrega, o plugin publica `window.OlympicSchool` e dispara o evento `olympic-school:ready`. Os futuros blocos do Gutenberg usarão estas áreas:

- `auth`: sessão Google e perfil;
- `conversations`: histórico e mensagens;
- `assistant`: Gemini e correção discursiva;
- `learning`: tentativas, domínio e eventos;
- `studyPlans`: persistência dos planos;
- `artifacts`: materiais salvos;
- `files`: validação e leitura inline de anexos;
- `domain`: regras determinísticas de aprendizagem e planos.

Nenhuma senha ou service account é exposta. O SDK Web usa a configuração pública do app, enquanto Authentication, Security Rules e App Check protegem as operações.

## Validar o JavaScript (opcional)

Dentro da pasta do plugin, com Node.js 20 ou superior:

```powershell
npm test
npm run check
```

## Instalar

1. Compacte o conteúdo da pasta `wordpress-plugin` como `olympic-school.zip`, incluindo `src/`, `includes/`, `olympic-school.php` e `index.php`.
2. No WordPress, abra **Plugins → Adicionar plugin → Enviar plugin**.
3. Ative **Olympic School**.
4. Abra **Configurações → Olympic School** e informe a configuração pública do aplicativo Web do Firebase.
5. Crie uma página e adicione o shortcode `[olympic_school_app]`.
6. Adicione o domínio do WordPress aos domínios autorizados do Firebase Authentication e valide o App Check antes de ativar enforcement.

Não coloque senhas, chaves privadas, service accounts ou tokens pessoais nos campos do plugin.
