# Status de implementação do MVP

Data: 2026-07-29

## Implementado

- Repositório local recuperado do ZIP e conectado ao remote correto.
- Branch `feat/mvp-biodoraia`.
- Especificação integral na raiz.
- Landing page e identidade visual preservadas.
- Área de estudos responsiva em `/app`.
- Diagnóstico inicial com 15 questões e dez habilidades.
- Correção objetiva determinística.
- Registro de resposta, tempo, dificuldade, acerto e tipo de erro.
- Domínio por habilidade entre 0 e 100.
- Classificação de lacunas e confiança conforme volume de evidências.
- Seleção adaptativa da próxima questão.
- Painel de progresso básico.
- Persistência local encapsulada, marcada explicitamente como temporária.
- Seis testes unitários do motor de aprendizagem.

## Não implementado

- Projeto e Web App Firebase.
- Login Google real e rotas protegidas.
- Perfil no Firestore.
- Firestore, Storage, App Check e regras.
- Firebase AI Logic e respostas Gemini reais.
- Correção discursiva assistida por IA.
- Planos de estudo persistentes.
- Notebooks externos persistentes.
- Upload de PDF, TXT e Markdown.
- Artefatos de estudo.
- Emuladores e testes de Security Rules.
- Deploy e push remoto.

## Validações executadas

- `npm run lint`: aprovado, com sete avisos preexistentes de Fast Refresh.
- `npm run test`: seis testes aprovados.
- `npm run build`: aprovado.
- `npm audit --omit=dev`: zero vulnerabilidades de produção.
- HTTP local em `/app`: status 200.
- Scan local de padrões de segredo: nenhuma ocorrência.

## Bloqueio atual

A conta Firebase autenticada não contém um projeto BiodoraIA. As instruções oficiais exigem uma escolha explícita entre um Project ID existente e a criação de um novo projeto antes de provisionar serviços. O único projeto encontrado pertence a outro produto e não foi alterado.

## Próximo passo

Receber um Project ID novo e disponível para a BiodoraIA. Depois disso:

1. criar ou selecionar o projeto;
2. registrar o Web App;
3. identificar a edição do Firestore;
4. configurar Auth, Firestore, Storage e App Check;
5. auditar e testar as regras;
6. provisionar AI Logic;
7. substituir a persistência local e os mocks por integrações reais.
