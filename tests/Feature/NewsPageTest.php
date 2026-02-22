<?php

use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders news page with synced news items', function () {
    CatalogEntity::query()->create([
        'entity_type' => 'anime',
        'mal_id' => 100,
        'title' => 'Anime de Teste',
        'payload' => [],
    ]);

    EntityRelation::query()->create([
        'from_type' => 'anime',
        'from_mal_id' => 100,
        'to_type' => 'news',
        'to_mal_id' => 5000,
        'relation_type' => 'news',
        'meta' => [
            'title' => 'Nova atualização anunciada',
            'excerpt' => 'Resumo da notícia de teste.',
            'url' => 'https://example.com/news/1',
            'author' => 'Equipe',
            'date' => '2026-02-20T12:00:00+00:00',
        ],
    ]);

    $response = $this->get('/news');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('NewsList')
        ->has('items', 1)
        ->where('items.0.title', 'Nova atualização anunciada')
        ->where('items.0.mediaType', 'anime'));
});

it('applies news sorting and filters', function () {
    CatalogEntity::query()->create([
        'entity_type' => 'anime',
        'mal_id' => 200,
        'title' => 'Anime A',
        'payload' => [],
    ]);

    CatalogEntity::query()->create([
        'entity_type' => 'manga',
        'mal_id' => 201,
        'title' => 'Mangá B',
        'payload' => [],
    ]);

    EntityRelation::query()->create([
        'from_type' => 'anime',
        'from_mal_id' => 200,
        'to_type' => 'news',
        'to_mal_id' => 6001,
        'relation_type' => 'news',
        'weight' => 2,
        'meta' => [
            'title' => 'Baixa discussão',
            'url' => 'https://example.com/news/a',
        ],
    ]);

    EntityRelation::query()->create([
        'from_type' => 'anime',
        'from_mal_id' => 200,
        'to_type' => 'news',
        'to_mal_id' => 6002,
        'relation_type' => 'news',
        'weight' => 10,
        'meta' => [
            'title' => 'Alta discussão',
            'url' => 'https://example.com/news/b',
        ],
    ]);

    EntityRelation::query()->create([
        'from_type' => 'manga',
        'from_mal_id' => 201,
        'to_type' => 'news',
        'to_mal_id' => 6003,
        'relation_type' => 'news',
        'weight' => 9,
        'meta' => [
            'title' => 'Notícia de mangá',
            'url' => 'https://example.com/news/c',
        ],
    ]);

    $response = $this->get('/news?type=anime&sort=comments&sort_dir=desc');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('NewsList')
        ->has('items', 2)
        ->where('items.0.title', 'Alta discussão')
        ->where('filters.type', 'anime')
        ->where('filters.sort', 'comments')
        ->where('filters.sort_dir', 'desc'));
});
