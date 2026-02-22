<?php

use App\Models\CatalogEntity;
use App\Models\User;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders favorites page with marked action state per item', function () {
    $user = User::factory()->create();

    CatalogEntity::query()->create([
        'entity_type' => 'anime',
        'mal_id' => 101,
        'title' => 'Anime Teste',
        'status' => 'Finalizado',
        'score' => 8.4,
        'payload' => [
            'type' => 'TV',
            'genres' => [
                ['name' => 'Ação'],
            ],
            'studios' => [
                ['name' => 'Studio A'],
            ],
        ],
    ]);

    CatalogEntity::query()->create([
        'entity_type' => 'manga',
        'mal_id' => 202,
        'title' => 'Manga Teste',
        'status' => 'Publicando',
        'score' => 7.8,
        'payload' => [
            'type' => 'Manga',
            'genres' => [
                ['name' => 'Drama'],
            ],
            'studios' => [],
        ],
    ]);

    UserFavorite::query()->create([
        'user_id' => $user->id,
        'entity_type' => 'anime',
        'mal_id' => 101,
    ]);

    UserFavorite::query()->create([
        'user_id' => $user->id,
        'entity_type' => 'manga',
        'mal_id' => 202,
    ]);

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'anime',
        'mal_id' => 101,
        'status' => 'assistindo',
    ]);

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'manga',
        'mal_id' => 202,
        'status' => 'planejado',
    ]);

    $response = $this->actingAs($user)->get('/app/favoritos');

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Favorites')
        ->has('favorites', 2)
        ->where('favorites.0.malId', 101)
        ->where('favorites.0.mediaType', 'anime')
        ->where('favorites.0.userActions.favorite', true)
        ->where('favorites.0.userActions.status', 'assistindo')
        ->where('favorites.1.malId', 202)
        ->where('favorites.1.mediaType', 'manga')
        ->where('favorites.1.userActions.favorite', true)
        ->where('favorites.1.userActions.status', null)
    );
});

it('renders manga detail with user actions for authenticated user', function () {
    $user = User::factory()->create();

    CatalogEntity::query()->create([
        'entity_type' => 'manga',
        'mal_id' => 999,
        'title' => 'Manga Detalhe',
        'status' => 'Finalizado',
        'score' => 9.1,
        'payload' => [
            'type' => 'Manga',
            'genres' => [],
            'studios' => [],
            'relations' => [],
        ],
        'payload_full' => [
            'stats' => [],
            'relations' => [],
        ],
    ]);

    UserFavorite::query()->create([
        'user_id' => $user->id,
        'entity_type' => 'manga',
        'mal_id' => 999,
    ]);

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'manga',
        'mal_id' => 999,
        'status' => 'dropado',
    ]);

    $response = $this->actingAs($user)->get('/manga/999');

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('MangaDetail')
        ->where('entity.malId', 999)
        ->where('entity.userActions.favorite', true)
        ->where('entity.userActions.status', 'dropado')
    );
});

it('renders anime detail with user actions for authenticated user', function () {
    $user = User::factory()->create();

    CatalogEntity::query()->create([
        'entity_type' => 'anime',
        'mal_id' => 888,
        'title' => 'Anime Detalhe',
        'status' => 'Finalizado',
        'score' => 8.9,
        'payload' => [
            'type' => 'TV',
            'genres' => [],
            'studios' => [],
            'relations' => [],
        ],
        'payload_full' => [
            'relations' => [],
            'stats' => [],
            'characters' => [],
            'staff' => [],
            'streaming' => [],
            'theme' => [
                'openings' => [],
                'endings' => [],
            ],
        ],
    ]);

    UserFavorite::query()->create([
        'user_id' => $user->id,
        'entity_type' => 'anime',
        'mal_id' => 888,
    ]);

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'anime',
        'mal_id' => 888,
        'status' => 'completo',
    ]);

    $response = $this->actingAs($user)->get('/anime/888');

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('AnimeDetail')
        ->where('entity.malId', 888)
        ->where('entity.userActions.favorite', true)
        ->where('entity.userActions.status', 'completo')
    );
});
