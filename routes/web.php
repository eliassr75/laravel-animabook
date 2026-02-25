<?php

use App\Http\Controllers\AnimeController;
use App\Http\Controllers\AnimeEpisodesController;
use App\Http\Controllers\App\AdminSeoController;
use App\Http\Controllers\App\AdminSitemapController;
use App\Http\Controllers\App\AdminUsersController;
use App\Http\Controllers\App\DashboardController;
use App\Http\Controllers\App\FavoritesController;
use App\Http\Controllers\App\MediaActionController;
use App\Http\Controllers\App\MediaEpisodeProgressController;
use App\Http\Controllers\App\MediaReviewController;
use App\Http\Controllers\App\MediaScoreController;
use App\Http\Controllers\App\ProfileController;
use App\Http\Controllers\App\VoteController;
use App\Http\Controllers\App\WatchlistController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MangaController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\PeopleController;
use App\Http\Controllers\Public\CatalogController;
use App\Http\Controllers\Public\RandomController;
use App\Http\Controllers\Public\SeasonsController;
use App\Http\Controllers\Public\TopController;
use App\Http\Controllers\SitemapController;
use App\Services\UserMediaActionsService;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', HomeController::class)->name('home');

Route::prefix('artisan')->group(function () {
    Route::get('/migrate', fn () => Artisan::call('migrate --force'));
    Route::get('/cache-clear', fn () => Artisan::call('cache:clear --force'));
    Route::get('/optimize:clear', fn () => Artisan::call('optimize:clear --force'));
    Route::get('/optimize', fn () => Artisan::call('optimize'));
});

Route::get('anime', [AnimeController::class, 'index']);
Route::get('anime/{malId}', [AnimeController::class, 'show']);
Route::get('anime/{malId}/episodes', [AnimeEpisodesController::class, 'index']);
Route::get('anime/{malId}/episodes/{episode}', [AnimeEpisodesController::class, 'show']);

Route::get('manga', [MangaController::class, 'index']);
Route::get('manga/{malId}', [MangaController::class, 'show']);
Route::get('news', NewsController::class);
Route::get('seasons', SeasonsController::class);
Route::get('top', TopController::class);
Route::get('genres', fn () => app(CatalogController::class)->list('genre', 'Gêneros', 'Explore animes por gênero.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('genres/{malId}', fn (int $malId) => app(CatalogController::class)->show('genre', 'Gênero', $malId, app(UserMediaActionsService::class)));
Route::get('characters', fn () => app(CatalogController::class)->list('character', 'Personagens', 'Descubra personagens populares de animes e mangás.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('characters/{malId}', [CharacterController::class, 'show']);
Route::get('people', fn () => app(CatalogController::class)->list('person', 'Pessoas', 'Descubra dubladores, diretores e artistas.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('people/{malId}', [PeopleController::class, 'show']);
Route::get('producers', fn () => app(CatalogController::class)->list('producer', 'Produtores', 'Explore estúdios e produtoras de anime.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('producers/{malId}', fn (int $malId) => app(CatalogController::class)->show('producer', 'Produtor', $malId, app(UserMediaActionsService::class)));
Route::get('magazines', fn () => app(CatalogController::class)->list('magazine', 'Revistas', 'Revistas de mangá e publicações.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('magazines/{malId}', fn (int $malId) => app(CatalogController::class)->show('magazine', 'Revista', $malId, app(UserMediaActionsService::class)));
Route::get('clubs', fn () => app(CatalogController::class)->list('club', 'Clubes', 'Participe de clubes da comunidade.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('clubs/{malId}', fn (int $malId) => app(CatalogController::class)->show('club', 'Clube', $malId, app(UserMediaActionsService::class)));
Route::get('watch', fn () => app(CatalogController::class)->list('watch', 'Assistir', 'Encontre onde assistir seus animes favoritos.', app(\App\Domain\Catalog\CatalogRepository::class), app(UserMediaActionsService::class)));
Route::get('watch/{malId}', fn (int $malId) => app(CatalogController::class)->show('watch', 'Assistir', $malId, app(UserMediaActionsService::class)));
Route::get('random', RandomController::class);
Route::get('ranking/melhor-anime', TopController::class);
Route::get('sitemap.xml', SitemapController::class);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('app/dashboard', DashboardController::class);
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('app/watchlist', WatchlistController::class);
    Route::get('app/favoritos', FavoritesController::class);
    Route::get('app/votar', VoteController::class);
    Route::get('app/perfil', ProfileController::class);
});

Route::middleware(['auth', 'throttle:120,1'])->group(function () {
    Route::post('app/media-actions', MediaActionController::class);
    Route::post('app/media-score', MediaScoreController::class);
    Route::post('app/media-episode-progress', MediaEpisodeProgressController::class);
});

Route::middleware(['auth', 'throttle:30,1'])->group(function () {
    Route::post('app/media-reviews', [MediaReviewController::class, 'store']);
    Route::delete('app/media-reviews', [MediaReviewController::class, 'destroy']);
});

Route::middleware(['auth', 'master', 'throttle:60,1'])->group(function () {
    Route::get('app/admin/users', AdminUsersController::class);
    Route::post('app/admin/seo', AdminSeoController::class);
    Route::post('app/admin/sitemap/refresh', AdminSitemapController::class);
});

Route::fallback(function () {
    return Inertia::render('NotFound');
});

require __DIR__.'/settings.php';
