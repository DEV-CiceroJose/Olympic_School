# Status de implementação do MVP

Atualizado em: 2026-08-04

## Implementado

- Repositório conectado a `DEV-CiceroJose/Olympic_School`.
- Estrutura separada em `frontend/` e `backend/`.
- Login Google, perfil individual, logout e rotas protegidas.
- Indicador real do usuário no assistente e na área de estudos.
- Focos predefinidos de Assistente, Tutor, Resumo, Questões, Flashcards, Mapa mental, Plano e
  Correção discursiva.
- Firebase AI Logic com Gemini, streaming, ferramentas de estudo e correção JSON estruturada.
- Conversas, mensagens, planos e artefatos privados no Firestore, com carregamento sob demanda.
- Diagnóstico por área, treino adaptativo, domínio por habilidade e progresso sincronizados no
  Firestore.
- Cache de recuperação separado por UID; dados do cache global antigo não são importados
  automaticamente.
- App Check com reCAPTCHA Enterprise.
- Anexos inline para IA sem Firebase Storage ou plano Blaze.
- Área docente protegida por custom claim para administrar questões, notebooks e prompts por foco.
- Questões e notebooks do Firestore sobrepõem o catálogo inicial sem retirar o fallback local.
- Regras com isolamento por usuário, validação de esquema e bloqueio por padrão.

## Limitações conhecidas

- Anexos não são armazenados após a sessão e estão limitados a cinco arquivos e 20 MB por mensagem.
- Notebooks externos são um catálogo somente leitura.
- Cotas gratuitas da IA são limitadas.
- O enforcement do App Check deve ser ativado gradualmente no domínio publicado.

## Validação

- Lint aprovado sem erros e com oito avisos de Fast Refresh já existentes.
- 28 testes automatizados aprovados sem credenciais de produção.
- Build de produção aprovado para cliente, SSR e worker Cloudflare.
- Auditoria npm aprovada sem vulnerabilidades conhecidas.
- Regras do Firestore compiladas e auditadas antes do deploy.

Login, Firestore, Gemini e App Check reais ainda precisam ser revalidados no domínio publicado após
esta atualização.
