<?php

use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeCatalogEntity(array $overrides = []): CatalogEntity
{
    $defaults = [
        'entity_type' => 'anime',
        'mal_id' => random_int(1000, 9999),
        'title' => 'Sample',
        'payload' => [],
    ];

    return CatalogEntity::create(array_merge($defaults, $overrides));
}

it('filters anime list by genre id', function () {
    $genre = makeCatalogEntity([
        'entity_type' => 'genre',
        'mal_id' => 501,
        'title' => 'Ação',
    ]);

    $animeA = makeCatalogEntity([
        'entity_type' => 'anime',
        'mal_id' => 101,
        'title' => 'Anime A',
        'score' => 8.9,
        'payload' => ['type' => 'TV'],
    ]);

    $animeB = makeCatalogEntity([
        'entity_type' => 'anime',
        'mal_id' => 102,
        'title' => 'Anime B',
        'score' => 7.2,
        'payload' => ['type' => 'TV'],
    ]);

    EntityRelation::create([
        'from_type' => 'anime',
        'from_mal_id' => $animeA->mal_id,
        'to_type' => 'genre',
        'to_mal_id' => $genre->mal_id,
        'relation_type' => 'genre',
        'weight' => 0,
        'meta' => [],
    ]);

    $response = $this->get('/anime?genre='.$genre->mal_id);

    $response->assertOk()->assertViewHas('page');

    $page = $response->viewData('page');
    expect($page['component'])->toBe('AnimeList');
    expect($page['props']['items'])->toHaveCount(1);
    expect($page['props']['items'][0]['malId'])->toBe($animeA->mal_id);
});

it('filters anime list by season using pt-br label', function () {
    $animeSpring = makeCatalogEntity([
        'entity_type' => 'anime',
        'mal_id' => 201,
        'title' => 'Anime Spring',
        'season' => 'spring',
        'year' => 2024,
        'score' => 9.1,
        'payload' => ['type' => 'TV'],
    ]);

    makeCatalogEntity([
        'entity_type' => 'anime',
        'mal_id' => 202,
        'title' => 'Anime Winter',
        'season' => 'winter',
        'year' => 2024,
        'score' => 8.1,
        'payload' => ['type' => 'TV'],
    ]);

    $response = $this->get('/anime?season=Primavera');

    $response->assertOk()->assertViewHas('page');

    $page = $response->viewData('page');
    expect($page['component'])->toBe('AnimeList');
    expect($page['props']['items'])->toHaveCount(1);
    expect($page['props']['items'][0]['malId'])->toBe($animeSpring->mal_id);
});
