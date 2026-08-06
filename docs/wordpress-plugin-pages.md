# Como utilizar o plugin Olympic School nas páginas do WordPress

## 1. O que fica no WordPress e o que fica no plugin

Use o Editor de Blocos para construir:

- landing page;
- navbar e rodapé;
- textos, imagens e chamadas de ação;
- páginas institucionais e políticas.

Use os shortcodes do plugin para inserir:

- login e perfil;
- painel do estudante;
- diagnóstico e treino;
- progresso e planos;
- notebooks e artefatos;
- assistente;
- painel docente.

Não recrie formulários de login, questões ou chat com Groups e Buttons. Esses componentes precisam do estado e das permissões fornecidos pelo plugin.

## 2. Preparação

1. Instale e ative **Olympic School**.
2. Abra **Configurações → Olympic School**.
3. Preencha a configuração pública do aplicativo Web do Firebase.
4. Salve.
5. Confirme que o domínio usado pelo WordPress está autorizado no Firebase Authentication.
6. Deixe o App Check sem enforcement até validar login, Firestore e IA nesse domínio.

Os campos do SDK Web não são senhas. Nunca insira uma service account, token GitHub ou chave privada.

## 3. Estrutura recomendada: uma página de aplicação

Esta é a opção mais simples e com menor risco de configuração.

1. Crie a página **Área do Estudante**.
2. Defina o slug como `area-do-estudante`.
3. Adicione um bloco **Shortcode**.
4. Cole:

```text
[olympic_school_app]
```

5. Use um template de página com largura total.
6. Publique.
7. Faça o botão **Entrar** da landing apontar para `/area-do-estudante/`.

O shortcode mostra automaticamente:

- login quando não existe sessão;
- formulário de perfil no primeiro acesso;
- aplicação completa depois da autenticação;
- aviso de configuração quando faltam dados do Firebase.

## 4. Estrutura alternativa: páginas separadas

Use esta opção quando diferentes colaboradores construirão os contêineres visuais de páginas diferentes.

| Página | Slug sugerido | Shortcode |
| --- | --- | --- |
| Entrar / visão geral | `area-do-estudante` | `[olympic_school_dashboard navigation="no"]` |
| Diagnóstico | `diagnostico` | `[olympic_school_diagnostic navigation="no"]` |
| Treino | `treino` | `[olympic_school_training navigation="no"]` |
| Progresso | `progresso` | `[olympic_school_progress navigation="no"]` |
| Plano de estudo | `plano-de-estudo` | `[olympic_school_plans navigation="no"]` |
| Notebooks | `notebooks` | `[olympic_school_notebooks navigation="no"]` |
| Artefatos | `artefatos` | `[olympic_school_artifacts navigation="no"]` |
| Assistente | `assistente` | `[olympic_school_assistant navigation="no"]` |
| Professor | `professor` | `[olympic_school_teacher navigation="no"]` |

Com `navigation="no"`, crie os links entre essas páginas no bloco Navigation do cabeçalho do WordPress. Sem esse atributo, o plugin exibe sua navegação interna e troca de módulo sem sair da página atual.

Todos os módulos verificam a autenticação. Se o estudante abrir diretamente `/progresso/` sem estar conectado, o login Google aparecerá primeiro.

## 5. Como inserir um shortcode

1. Abra a página no editor.
2. Clique em `+`.
3. Pesquise **Shortcode**.
4. Insira o bloco.
5. Cole apenas um dos códigos documentados.
6. Não coloque o shortcode em um bloco Code ou Custom HTML.
7. Salve e visualize a página fora do editor.

O aplicativo pode aparecer simplificado dentro do editor; o teste funcional deve ser feito em **View page / Ver página**.

## 6. Login e cadastro

O sistema não possui senha local. O fluxo é:

1. estudante clica em **Entrar com Google**;
2. Firebase Authentication valida a conta;
3. no primeiro acesso, o plugin cria `users/{uid}`;
4. estudante informa nome e turma;
5. o perfil passa a ser considerado completo.

Portanto, login e cadastro acontecem na mesma interface. Não crie formulário separado de e-mail e senha.

## 7. Diagnóstico e treino

O diagnóstico usa até 15 questões ativas e grava:

- tentativa;
- habilidade;
- acerto ou erro;
- dificuldade;
- tempo de resposta;
- domínio calculado;
- evento de conclusão.

O treino escolhe a próxima atividade considerando domínio, erros repetidos, tempo recente e tópicos do plano. O cálculo é determinístico; a IA não inventa o progresso.

## 8. Assistente e anexos

O assistente oferece:

- Assistente;
- Tutor guiado;
- Resumo;
- Questões;
- Flashcards;
- Mapa mental;
- Plano de estudos;
- Correção discursiva.

São aceitos PDF, TXT e Markdown, com até 10 MB por arquivo e cinco anexos por envio. O conteúdo é enviado inline para a IA e não é armazenado depois da sessão.

Resumos, questões, flashcards, mapas mentais e planos gerados são salvos automaticamente em **Artefatos** quando a resposta termina.

## 9. Área docente

O shortcode `[olympic_school_teacher]` só funciona para uma conta com a custom claim `teacher: true`.

Antes do primeiro uso, publique as regras desta branch no projeto `biodoraia` (isso exige login autorizado no Firebase CLI):

```powershell
npm run firebase:deploy:firestore
```

Para conceder acesso, no repositório execute com credenciais administrativas locais autorizadas:

```powershell
npm run teacher:set-claim -- professor@escola.com true
```

A pessoa precisa sair e entrar novamente para renovar o token. A área permite:

- criar, editar, ativar e remover questões;
- criar, editar, ativar e remover notebooks externos;
- personalizar as instruções dos focos da IA.

Não conceda a claim docente a estudantes.

## 10. Estilos e composição

- Use página ou Group em largura total.
- Evite limitar o shortcode a uma coluna estreita.
- Não aplique cor de texto diretamente ao Group que envolve o shortcode.
- Evite CSS global com seletores genéricos como `button`, `input` ou `pre`.
- O plugin usa classes prefixadas com `.os-` para reduzir conflitos com o tema.
- Em páginas separadas, mantenha navbar e rodapé como Template Parts globais.

## 11. Colaboração e importação de páginas

Cada colaborador pode criar uma página diferente e exportá-la por **Tools → Export → Pages**. O arquivo WXR/XML transporta os blocos da página, mas não transporta com segurança:

- configurações do Firebase;
- alterações globais do tema;
- navbar e rodapé;
- plugin atualizado;
- imagens locais inacessíveis pelo outro computador.

Ambos devem usar a mesma versão do plugin. Envie imagens separadamente e mantenha uma única pessoa responsável pelo Editor do Site.

## 12. Checklist de validação

- [ ] Página abre sem aviso de campos ausentes.
- [ ] Popup do Google é exibido.
- [ ] Primeiro acesso solicita nome e turma.
- [ ] Logout retorna ao login.
- [ ] Diagnóstico conclui e mostra domínio por habilidade.
- [ ] Treino registra a nova tentativa.
- [ ] Progresso permanece depois de recarregar.
- [ ] Plano permanece depois de recarregar.
- [ ] Assistente transmite uma resposta.
- [ ] Histórico reaparece depois de recarregar.
- [ ] Anexo TXT/PDF/Markdown é aceito.
- [ ] Artefato gerado aparece na área de Artefatos.
- [ ] Notebook abre somente em HTTPS.
- [ ] Estudante comum não abre a área docente.
- [ ] Professor autorizado consegue salvar uma questão de teste.
- [ ] Layout funciona em celular.

## 13. Problemas comuns

### Domínio não autorizado

Adicione o domínio exibido no navegador em **Firebase Authentication → Settings → Authorized domains**.

### Permission denied

Confirme as regras do Firestore, a sessão correta e o App Check. Na área docente, confirme a claim `teacher`.

### IA retorna limite temporário

A camada gratuita possui cotas. Aguarde e tente novamente. Não ative faturamento apenas para contornar um teste.

### Shortcode aparece como texto

Use o bloco **Shortcode**, confirme que o plugin está ativo e verifique se o nome foi copiado sem alterações.

### Página funciona no editor, mas não no site

Teste fora do editor, limpe cache do navegador e confira o console. O SDK Firebase é carregado como módulo JavaScript no frontend.
