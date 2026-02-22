# Documentacao de Frontend (Animabook)

Ultima atualizacao: 22/02/2026

## 1. Visao geral

O frontend e uma aplicacao React + Inertia dentro do Laravel.  
Nao existe API separada para a UI principal: o backend entrega pagina Inertia (props) e, para interacoes pontuais, endpoints JSON.

Objetivos principais da interface:

- Descoberta de anime/manga com filtros extensivos.
- Paginas de detalhe ricas (relacoes, equipe, musicas, noticias, stats, episodios).
- Acoes do usuario em qualquer card (favoritar/completo/assistir/drop).
- Gestao pessoal (watchlist, favoritos, notas, reviews, progresso de episodios).
- Painel master (dashboard, usuarios, SEO, sitemap).

## 2. Stack do frontend

- React 19 + TypeScript
- Inertia.js (`@inertiajs/react`)
- Vite 7
- Tailwind CSS v4 + `tw-animate-css`
- Radix UI + componentes em `components/ui/*`
- `react-toastify` para toasts globais
- `cmdk` para paleta de comandos da navbar
- `lucide-react` para icones

Arquivos de bootstrap:

- `resources/js/app.tsx`
- `resources/css/app.css`
- `resources/views/app.blade.php` (head/meta/tema inicial)

## 3. Estrutura de pastas (frontend)

`resources/js/`:

- `pages/`: paginas Inertia.
- `components/`: componentes reutilizaveis.
- `components/ui/`: biblioteca base de UI.
- `components/common/`: cards, filtros, paginacao, botoes de acao etc.
- `components/layout/AppShell.tsx`: shell principal (navbar, footer, busca global, dark/light).
- `layouts/`: layouts de app, auth e settings.
- `hooks/`: tema, mobile, clipboard, iniciais, 2FA.
- `lib/`: chamadas HTTP e utilitarios de dominio.
- `types/`: contratos TS.
- `data/mock.ts`: tipos base e dados utilitarios.

## 4. Roteamento de paginas

## 4.1 Publicas

- `/` -> `pages/Index.tsx`
- `/anime` -> `pages/AnimeList.tsx`
- `/anime/{id}` -> `pages/AnimeDetail.tsx`
- `/manga` -> `pages/MangaList.tsx`
- `/manga/{id}` -> `pages/MangaDetail.tsx`
- `/news` -> `pages/NewsList.tsx`
- `/seasons`, `/top`, `/genres`, `/characters`, `/people`, `/producers`, `/magazines`, `/clubs`, `/watch` -> `pages/CatalogList.tsx`
- `/genres/{id}`, `/producers/{id}`, `/magazines/{id}`, `/clubs/{id}`, `/watch/{id}` -> `pages/CatalogDetail.tsx`
- `/characters/{id}` -> `pages/CharacterDetail.tsx`
- `/people/{id}` -> `pages/PeopleDetail.tsx`
- fallback -> `pages/NotFound.tsx`
- item nao sincronizado (`/anime/{id}` ou `/manga/{id}` sem base local) -> `pages/CatalogSyncPending.tsx`

## 4.2 Autenticadas

- `/app/dashboard` -> `pages/Dashboard.tsx`
- `/app/watchlist` -> `pages/Watchlist.tsx`
- `/app/favoritos` -> `pages/Favorites.tsx`
- `/app/votar` -> `pages/Vote.tsx`
- `/app/perfil` -> `pages/Profile.tsx`

## 4.3 Auth/Settings

- `pages/auth/*` (login, cadastro, reset, verificacao, 2FA challenge)
- `pages/settings/*` (perfil, senha, aparencia, two-factor)

## 5. Layout, navegacao e UX base

`AppShell` centraliza:

- Navbar com links principais.
- Botao de busca global que abre Command Palette (`Ctrl/Cmd + K`).
- Toggle de aparencia dark/light.
- Menu mobile com links principais + conta.
- Footer com links secundarios.
- Container global de toasts (`react-toastify`).

Tema:

- Hook `useAppearance` salva preferencia em `localStorage` + cookie `appearance`.
- Inicializacao imediata em `initializeTheme()` para evitar flicker.
- Paleta e tokens em `resources/css/app.css` com variaveis CSS para claro/escuro.

## 6. Componentes de dominio importantes

- `AnimeCard.tsx`: card principal para anime/manga.
- `EntityCard.tsx`: card generico para entidades.
- `MediaActionButtons.tsx`: 4 acoes (favoritar/completo/assistir/dropar), com toggle.
- `MediaReviewComposer.tsx`: publicar/editar/remover review interna.
- `MediaStatsPanel.tsx`: painel visual de estatisticas.
- `FiltersBar.tsx`: chips de filtros ativos + limpeza.
- `PaginationBar.tsx`: paginacao padrao.
- `ScoreBadge.tsx`: selo de nota.

## 7. Camada de dados no frontend (`lib/*`)

HTTP/seguranca:

- `lib/http.ts`: monta cabecalhos autenticados com CSRF/XSRF.

Mutacoes do usuario:

- `lib/media-actions.ts` -> `POST /app/media-actions`
- `lib/media-score.ts` -> `POST /app/media-score`
- `lib/media-reviews.ts` -> `POST/DELETE /app/media-reviews`
- `lib/anime-episodes.ts` -> listar detalhes de episodios + salvar progresso

Feedback:

- `lib/notify.ts`: wrapper de toast (`info/success/error`).

Internacionalizacao e texto:

- `lib/i18n.ts`: mensagens `pt-BR` e `en`.
- `lib/labels.ts`: traducoes de tipo/status/relacao/cargo.
- `lib/text.ts`: prevencao de `"null"` textual, fallback com `--`.

## 8. Funcionalidades por tela

## 8.1 Listas (`AnimeList`, `MangaList`, `CatalogList`)

- Busca com debounce.
- Filtros combinados (genero, status, tipo, ano, temporada etc).
- Ordenacao com direcao asc/desc por icone.
- Chipagem de filtros ativos.
- Sincronizacao de estado via query string.
- Paginacao com preservacao de scroll/estado.

Diferenciais:

- Anime/Manga possuem filtros avancados extras, incluindo `sync_status`.
- Ranking (`/top`) usa destaque visual para top 3 e respeita regra de rank >= 1.
- Entidades compactas (ex: genero/produtor/revista/clube) podem aparecer em modo lista simplificada.

## 8.2 Detalhe de anime (`AnimeDetail`)

Abas:

- Visao geral
- Episodios (lazy-load ao clicar)
- Relacoes (busca interna)
- Staff (busca interna)
- Musicas
- Personagens
- Reviews
- Noticias
- Recomendacoes
- Estatisticas

Recursos:

- Hero + capa centralizada.
- Botoes de acao com labels na pagina de detalhe.
- Episodios com marcacao em lote, persistencia e detalhamento.
- Uso de imagem/video de episodio quando disponivel.

## 8.3 Detalhe de manga (`MangaDetail`)

Semelhante ao anime, com foco em:

- Capitulos/volumes.
- Relacoes em cards.
- Personagens, reviews, noticias, recomendacoes e stats.

## 8.4 Watchlist (`Watchlist`)

Modos:

- Tabela.
- Cards.

Interacoes:

- Filtro por status.
- Dialog de nota (slider e botoes rapidos).
- Dialog de progresso por episodios:
  - busca local de episodios
  - marcar/desmarcar
  - preview de detalhes de episodio
  - feedback visual de loading/salvamento

## 8.5 Favoritos (`Favorites`)

- Busca textual local.
- Filtro por tipo (`all/anime/manga`).
- Reuso de `AnimeCard` com base de link por tipo.

## 8.6 Home (`Index`)

- Hero com CTA.
- Blocos de estatisticas da base.
- Graficos simples (barras) para tendencia e distribuicoes.
- Ranking em destaque.
- Temporada atual, recomendacoes, reviews recentes, noticias recentes.
- CTA contextual para usuario logado/deslogado.

## 8.7 Perfil (`Profile`)

Usuario comum:

- Resumo de status/favoritos/nota media/conclusao.
- Aba de conta com atalhos para editar perfil/senha/sair.

Master:

- Dashboard admin (KPIs e tendencias).
- Gestao de usuarios (busca + paginacao).
- Top usuarios.
- Editor de SEO (global/static/dynamic/sitemap em JSON).
- Acao de refresh de sitemap.

## 9. Responsividade e mobile

Pontos implementados:

- Navbar mobile com drawer simples.
- Grade de cards adaptativa por breakpoint.
- Tabs horizontais com overflow.
- Dialogs de score/progresso adaptados para viewport menor.
- Cards de detalhe com capa centralizada no mobile.

## 10. SEO e head no frontend

Embora exista `components/seo/SeoHead.tsx`, a fonte oficial de SEO esta no Blade:

- `resources/views/app.blade.php` renderiza `title`, `meta`, OpenGraph e Twitter a partir de `page.props.seo`.

Isso garante metadados em todas as telas Inertia, inclusive dinamicas.

## 11. Build, qualidade e verificacao

Comandos de validacao:

```bash
npm run lint
npm run types
npm run build
```

Comando de desenvolvimento:

```bash
npm run dev
```

## 12. Observacoes de estado atual

- A pagina `/app/votar` hoje e interface local de fluxo de voto (estado no cliente), sem persistencia dedicada no backend.
- Existe tabela/modelo `user_votes`, mas o fluxo completo de voto por endpoint ainda nao esta conectado na UI.
