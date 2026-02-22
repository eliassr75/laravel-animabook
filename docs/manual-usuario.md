# Manual do Usuario (Animabook)

Ultima atualizacao: 22/02/2026

## 1. O que e o Animabook

O Animabook e uma plataforma para:

- descobrir animes e mangas;
- salvar favoritos;
- organizar sua lista pessoal;
- marcar progresso de episodios;
- dar nota e escrever avaliacoes;
- acompanhar noticias, relacoes e recomendacoes.

## 2. Acesso e conta

## 2.1 Criar conta

1. Clique em `Criar conta`.
2. Preencha nome, email e senha.
3. Entre com suas credenciais na tela de login.

## 2.2 Login

1. Clique em `Entrar`.
2. Informe email e senha.
3. Se necessario, conclua verificacao/2FA.

Dica: sem login, acoes como favoritar, marcar status, nota e review exibem aviso para autenticar.

## 3. Navegacao principal

Menu superior:

- `Inicio`
- `Anime`
- `Manga`
- `Noticias`
- `Temporadas`
- `Ranking`

Atalhos:

- `Ctrl + K` (ou `Cmd + K`) abre a busca rapida de paginas.
- Botao de lua/sol alterna tema claro/escuro.

## 4. Como pesquisar e filtrar

Nas listas de anime/manga voce pode:

- buscar por titulo;
- filtrar por genero, status, tipo, temporada, ano;
- filtrar por nota/rank/membros (quando disponivel);
- ordenar por criterio (nota, rank, popularidade, titulo, data etc);
- inverter ordem (asc/desc) no botao de seta.

Os filtros ativos aparecem em chips; clique no chip para remover ou use `Limpar tudo`.

## 5. Acoes nos cards e detalhes

Cada anime/manga possui 4 acoes:

- `Favoritar`
- `Completo`
- `Assistir`
- `Dropei`

Comportamento:

- funciona em toggle (clicou de novo, desfaz);
- em cards, aparecem apenas icones;
- em paginas de detalhe, aparecem com texto.

## 6. Pagina de detalhe (anime/manga)

Conteudo principal:

- sinopse e informacoes da obra;
- relacoes com outras obras/personagens;
- equipe (staff), musicas e estatisticas;
- reviews e recomendacoes;
- noticias relacionadas.

Em anime, existe aba de episodios com:

- lista de episodios;
- marcacao de episodios assistidos;
- salvamento de progresso na sua conta.

## 7. Reviews (avaliacoes de texto)

Para avaliar:

1. Entre na aba `Avaliacoes` no detalhe da obra.
2. Defina nota (0 a 10).
3. Escreva texto (minimo 20 caracteres).
4. Salve.

Voce pode editar ou remover sua propria review depois.

## 8. Minha lista (`/app/watchlist`)

Funcoes:

- alternar visualizacao entre tabela e cards;
- filtrar por status (`Assistindo`, `Completo`, `Planejado`, `Pausado`, `Dropado`);
- abrir dialog para:
  - dar/editar nota;
  - marcar episodios assistidos (anime).

O progresso salvo atualiza sua contagem automaticamente.

## 9. Favoritos (`/app/favoritos`)

Funcionalidades:

- busca por titulo/genero;
- filtro por tipo (`Todos`, `Anime`, `Manga`);
- acesso direto ao detalhe de cada item.

## 10. Dashboard pessoal (`/app/dashboard`)

Mostra resumo rapido:

- quantos itens voce esta assistindo/completou etc;
- nota media;
- total de episodios assistidos;
- atalhos para lista, favoritos, voto e exploracao.

## 11. Perfil (`/app/perfil`)

Aba `Resumo`:

- KPIs pessoais;
- distribuicao por status.

Aba `Conta`:

- editar perfil;
- alterar senha;
- sair da conta.

## 12. Pagina de voto (`/app/votar`)

Fluxo atual da tela:

1. Escolher escopo;
2. Buscar anime;
3. Confirmar voto.

Observacao:

- hoje o fluxo e de interface e confirmacao visual;
- persistencia completa de voto por endpoint ainda nao esta habilitada.

## 13. Modo escuro/claro

O tema pode ser trocado no botao da navbar.  
A preferencia fica salva para as proximas visitas.

## 14. Mensagens e feedback

O sistema usa toasts para avisar:

- sucesso ao salvar acao/nota/review/progresso;
- erro de validacao ou falha de requisicao;
- necessidade de login.

## 15. Erros comuns e como resolver

- `CSRF token mismatch`: atualize a pagina e tente novamente; se persistir, faca logout/login.
- Item com ID de anime/manga nao encontrado: aguarde sincronizacao e tente novamente (tela de sincronizacao pendente).
- Episodios nao carregando: abra a aba `Episodios` e aguarde; o carregamento e sob demanda.

## 16. Area master (apenas email autorizado)

Usuario master padrao:

- `elias.craveiro@animabook.net`

Recursos extras no perfil:

- dashboard completo da plataforma;
- gestao e busca de usuarios;
- ranking de usuarios mais ativos;
- configuracao robusta de SEO (global, estatico, dinamico, sitemap);
- geracao/refresh de sitemap.
