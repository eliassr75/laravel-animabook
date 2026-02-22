<?php

use App\Models\CatalogEntity;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeAnimeForRanking(array $overrides = []): CatalogEntity
{
    $defaults = [
        'entity_type' => 'anime',
        'mal_id' => random_int(1000, 9999),
        'title' => 'Anime',
        'payload' => ['type' => 'TV'],
        'rank' => null,
        'score' => 8.0,
    ];

    return CatalogEntity::query()->create(array_merge($defaults, $overrides));
}

it('excludes anime with rank 0 from top ranking page', function () {
    $valid = makeAnimeForRanking([
        'mal_id' => 100,
        'title' => 'Anime Válido',
        'rank' => 1,
    ]);

    makeAnimeForRanking([
        'mal_id' => 101,
        'title' => 'Anime Rank Zero',
        'rank' => 0,
    ]);

    $response = $this->get('/top');

    $response->assertOk()->assertViewHas('page');

    $page = $response->viewData('page');
    expect($page['component'])->toBe('CatalogList');
    expect(collect($page['props']['items'])->pluck('malId')->all())->toBe([$valid->mal_id]);
    expect(collect($page['props']['items'])->pluck('rank')->min())->toBeGreaterThanOrEqual(1);
});

it('excludes anime with rank 0 from home ranking section', function () {
    $first = makeAnimeForRanking([
        'mal_id' => 200,
        'title' => 'Top #1',
        'rank' => 1,
    ]);

    makeAnimeForRanking([
        'mal_id' => 201,
        'title' => 'Sem Rank Válido',
        'rank' => 0,
    ]);

    $response = $this->get('/');

    $response->assertOk()->assertViewHas('page');

    $page = $response->viewData('page');
    expect($page['component'])->toBe('Index');
    expect(collect($page['props']['topAnime'])->pluck('malId')->all())->toBe([$first->mal_id]);
    expect(collect($page['props']['topAnime'])->pluck('rank')->min())->toBeGreaterThanOrEqual(1);
});

