# Documentacao de Backend (Animabook)

Ultima atualizacao: 22/02/2026

## 1. Visao geral

O backend roda em Laravel 12 com Inertia.js (SSR parcial via Blade + React).  
O sistema tem tres blocos principais:

1. Camada HTTP (rotas + controllers Inertia/JSON).
2. Camada de dominio (repositorios/servicos de catalogo, usuario, SEO, sitemap, episodios).
3. Integracao assicrona com a API Jikan (jobs/fila + persistencia local).

Fluxo principal:

1. Requisicao chega em `routes/web.php`.
2. Controller consulta repositorio/servico.
3. Dados sao montados a partir de `catalog_entities` e `entity_relations`.
4. Resposta vai para pagina Inertia (React) ou JSON.
5. Se item nao existir localmente, entra em tela de pendencia e job de sync e enfileirado.

## 2. Stack tecnica

- PHP: 8.3 (Docker base `php:8.3-apache`; `composer.json` com platform 8.3.0)
- Framework: Laravel 12
- Auth: Laravel Fortify
- Observabilidade: Sentry + Telescope
- Fila: `database` (sem Redis)
- Integracao externa: Jikan v4 (`https://api.jikan.moe/v4`)

Arquivos-chave:

- `bootstrap/app.php`
- `routes/web.php`
- `routes/console.php`
- `app/Domain/Catalog/CatalogRepository.php`
- `app/Integrations/Jikan/*`
- `app/Jobs/*`
- `resources/views/app.blade.php`

## 3. Estrutura de pastas (backend)

`app/`:

- `Http/Controllers`: endpoints publicos, autenticados e admin.
- `Http/Middleware`: tema, props Inertia e bloqueio de master.
- `Domain/Catalog`: consulta/filtragem de catalogo.
- `Services`: regras de negocio (acoes do usuario, episodios, admin, SEO, sitemap).
- `Integrations/Jikan`: cliente HTTP, endpoints, mapper e governanca de ingestao.
- `Jobs`: sincronizacao e semeadura da base.
- `Models`: entidades Eloquent.
- `Providers`: bootstrap de app, Fortify e Telescope.

`database/migrations/`:

- Esquema de usuarios/auth + catalogo + relacoes + cache Jikan + interacoes de usuario + SEO.

`routes/`:

- `web.php`: rotas HTTP.
- `settings.php`: perfil, senha, aparencia e 2FA.
- `console.php`: comandos artisan e schedule.

## 4. Rotas HTTP

### 4.1 Publicas

- `GET /` -> Home (`HomeController`)
- `GET /anime`, `GET /anime/{malId}` -> lista/detalhe anime
- `GET /anime/{malId}/episodes`, `GET /anime/{malId}/episodes/{episode}` -> JSON episodios
- `GET /manga`, `GET /manga/{malId}` -> lista/detalhe manga
- `GET /news`, `GET /seasons`, `GET /top`, `GET /ranking/melhor-anime`
- `GET /genres`, `/characters`, `/people`, `/producers`, `/magazines`, `/clubs`, `/watch`
- `GET /{tipo}/{malId}` para detalhes dessas entidades secundarias
- `GET /random`
- `GET /sitemap.xml`

Fallback:

- Qualquer rota nao mapeada renderiza `NotFound` (Inertia).

### 4.2 Autenticadas

Com `auth` + `verified`:

- `GET /app/dashboard`
- `GET /app/watchlist`
- `GET /app/favoritos`
- `GET /app/votar`
- `GET /app/perfil`

Com `auth` + `throttle:120,1`:

- `POST /app/media-actions` (favoritar, assistindo, completo, dropado)
- `POST /app/media-score` (nota do usuario)
- `POST /app/media-episode-progress` (episodios assistidos)

Com `auth` + `throttle:30,1`:

- `POST /app/media-reviews`
- `DELETE /app/media-reviews`

### 4.3 Admin (master)

Com `auth` + `master` + `throttle:60,1`:

- `GET /app/admin/users`
- `POST /app/admin/seo`
- `POST /app/admin/sitemap/refresh`

Regra de master:

- Middleware `EnsureMasterUser` valida email contra `config('animabook.master_email')`.
- Default: `elias.craveiro@animabook.net`.

### 4.4 Settings/Fortify

Rotas em `routes/settings.php` e Fortify:

- Perfil, senha, aparencia, two-factor.
- Login, cadastro, reset de senha, confirmacao etc.

## 5. Middlewares e seguranca

Configuracao central em `bootstrap/app.php`.

- `HandleAppearance`: compartilha modo visual via cookie `appearance`.
- `HandleInertiaRequests`: props globais (`auth`, `sidebarOpen`, `seo`).
- `EnsureMasterUser`: bloqueio 403 para nao master.

Protecoes relevantes:

- CSRF padrao Laravel (token em `meta[name=csrf-token]`).
- Front usa `X-XSRF-TOKEN` (cookie `XSRF-TOKEN`) com fallback para `X-CSRF-TOKEN` (`resources/js/lib/http.ts`).
- Rate limit em login/Fortify e endpoints sensiveis.
- `AppServiceProvider`: bloqueia comandos destrutivos em producao e endurece politica de senha.
- `TelescopeServiceProvider`: mascara cabecalhos sensiveis e libera acesso para master.

## 6. Modelagem de dados

## 6.1 Tabelas de catalogo

- `catalog_entities`
  - Chave unica: `(entity_type, mal_id)`
  - Campos indexaveis: titulo, score, rank, popularidade, season/year, status
  - JSON: `payload` (base), `payload_full` (enriquecido), `images`, `trailer`, `external_links`
  - Controle de ingestao: `last_fetched_at`, `next_refresh_at`, `fetch_failures`, `last_error`

- `entity_relations`
  - Relacoes entre entidades: genero, recomendacao, personagem, voice/staff, review, news, episode etc.
  - Chave unica curta para MySQL: `entity_relations_unique`
  - JSON `meta` com payload original da relacao

- `jikan_cache`
  - Cache de chamadas externas por `key`/endpoint/query/status/expiracao.

## 6.2 Tabelas de usuario

- `user_media_status`
  - Status por obra (`assistindo`, `completo`, `dropado`, `planejado`, etc)
  - Progresso e `user_score`
  - `notes` guarda metadados (ex: `watched_episodes` em JSON)
  - Unico: `(user_id, media_type, mal_id)`

- `user_favorites`
  - Favoritos de anime/manga por usuario
  - Unico: `(user_id, entity_type, mal_id)`

- `user_reviews`
  - Review interna do usuario por obra
  - Unico: `(user_id, media_type, mal_id)`

- `user_votes`
  - Modelo de voto por escopo (estrutura pronta no banco)
  - Unico: `(user_id, scope)`

## 6.3 Tabelas de governanca/SEO

- `ingest_budgets`: limite diario por bucket de ingestao.
- `ingest_leases`: lock por entidade para evitar corrida de workers.
- `seo_settings`: override persistente de config SEO.

## 7. Dominio e servicos

### 7.1 Catalogo

`CatalogRepository`:

- Lista e detalhe por tipo de entidade.
- Filtros: busca, ano, temporada (pt/en), status, genero, tipo, score, rank, membros, sync_status.
- Ordenacao com direcao asc/desc.
- Opcoes dinamicas de filtros para front.

### 7.2 Acoes do usuario

`UserMediaActionsService`:

- `favorite` funciona como toggle.
- `watching/completed/dropped` viram `assistindo/completo/dropado`.
- Clique repetido no mesmo status:
  - remove registro se nao houver progresso/nota/notas extras;
  - ou cai para `planejado` quando houver dados de rastreio.
- Nota do usuario e salva em `user_media_status.user_score`.

### 7.3 Episodios de anime

`AnimeEpisodesService`:

- Busca primeiro no banco (`entity_relations`).
- Se vazio, consulta Jikan (`/episodes` e `/videos/episodes`) e persiste.
- Cache curto de 5 minutos (`anime:episodes:v1:{malId}`).
- Junta metadados de episodio + video/imagem.

### 7.4 Admin

`AdminDashboardService`:

- KPIs gerais (usuarios, catalogo, interacoes).
- Tendencias de 14 dias.
- Top usuarios por score de atividade.
- Paginacao e busca de usuarios para painel master.

### 7.5 SEO e Sitemap

- `SeoSettingsService`: merge de `config/seo.php` com override em banco.
- `SeoResolver`: resolve metadados por rota estatica/dinamica.
- `SitemapService`: gera XML, faz cache e opcionalmente escreve `public/sitemap.xml`.

## 8. Integracao Jikan

Cliente:

- `JikanHttpClient` com retry, backoff exponencial, controle de concorrencia e intervalo minimo entre requests.

Endpoints integrados (`app/Integrations/Jikan/Endpoints`):

- Anime: `/{id}`, `/{id}/full`, `recommendations`, `reviews`, `characters`, `statistics`, `staff`, `episodes`, `episodes/{n}`, `news`, `videos/episodes`.
- Manga: `/{id}`, `recommendations`, `reviews`, `characters`, `statistics`, `news`.
- Auxiliares: top, seasons, search, genres, producers, magazines, clubs, watch, random, users.

Persistencia:

- `CatalogEntityMapper` transforma payload externo em campos indexaveis.
- `Ingestor` executa upsert idempotente em `catalog_entities`.
- `RefreshPolicy` calcula `next_refresh_at` por tipo/status.

## 9. Jobs, filas e agendamento

Fila:

- Driver padrao: `database`.
- Filas usadas: `high`, `default`, `low`.

Jobs principais:

- `SyncEntityJob`: sincroniza entidade (anime/manga/character/person/producer), salva `payload_full` quando aplicavel e dispara `SyncRelationsJob`.
- `SyncRelationsJob`: salva recomendacoes, reviews, noticias, personagens, voice actors, staff e enfileira dependencias.
- Seeds: `SeedTopJob`, `SeedSeasonsJob`, `SeedDiscoveryJob`, `SeedGenresJob`, `SeedProducersJob`, `SeedMagazinesJob`, `SeedClubsJob`, `SeedWatchJob`, `SeedPeopleFromRelationsJob`.
- `RefreshPlannerJob`: re-enfileira entidades vencidas por `next_refresh_at`.
- `RebuildSearchIndexJob`: placeholder.

Schedule (`routes/console.php`):

- Top a cada 15 min, temporadas a cada 30 min.
- Planner diario.
- Seeds diarios/semanais.
- Refresh de sitemap a cada 30 min.

Comandos artisan relevantes:

- `php artisan catalog:seed-initial`
- `php artisan catalog:refresh-anime-full --limit= --from= --queue=`
- `php artisan catalog:refresh-manga-full --limit= --from= --queue=`
- `php artisan seo:sitemap:refresh --write-file`

## 10. SEO no Blade (ponto critico do projeto)

O HTML final de SEO fica no `resources/views/app.blade.php`.

Tags renderizadas no Blade:

- `title`
- `meta description`
- `meta robots`
- `canonical`
- `og:*`
- `twitter:*`

Fonte dos dados:

- `HandleInertiaRequests` -> prop compartilhada `seo` -> `SeoResolver`.

## 11. Deploy e operacao

Docker:

- `Dockerfile`: PHP 8.3 + Apache + extensoes necessarias.
- `docker-compose.yml`: um container por fila (`default`, `high`, `low`) + scheduler.
- `queue-worker.sh`: copia `.env.host` para `.env` e sobe `supervisord`.
- `queue-scheduler.sh`: executa `php artisan schedule:work`.
- `supervisord.conf`: roda `php artisan queue:work`.

Deploy:

- `deploy.sh` atualiza branch e recria containers de workers/scheduler.

## 12. Testes e validacao

Suite backend (Pest):

- Auth/Fortify.
- Filtros de catalogo.
- Regras de top ranking (rank >= 1).
- Acoes de usuario (favorito/status/nota/review).
- Estado em paginas (detalhes, favoritos).
- SEO e sitemap admin.
- Sync pending.

Comandos recomendados:

```bash
php artisan test
npm run lint
npm run types
```

## 13. Estado atual e observacoes

- Sistema de votos (`/app/votar`) hoje e majoritariamente de interface no front; nao ha endpoint POST dedicado para persistir votos.
- `user_votes` existe e ja e considerado nos indicadores admin.
- O fallback de detalhe ausente para anime/manga nao retorna 404 seco: abre pagina de sincronizacao (`CatalogSyncPending`) e enfileira sync.
