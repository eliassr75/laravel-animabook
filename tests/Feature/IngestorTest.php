<?php

use App\Integrations\Jikan\Ingestor;
use App\Integrations\Jikan\RefreshPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('upserts catalog entities idempotently', function () {
    $ingestor = new Ingestor(new RefreshPolicy());

    $payload = ['title' => 'Test Anime'];
    $indexable = [
        'title' => 'Test Anime',
        'title_normalized' => 'test anime',
        'synopsis_short' => 'Short synopsis',
        'year' => 2024,
        'season' => 'Winter',
        'status' => 'Finished',
        'rating' => 'PG-13',
        'score' => 8.5,
        'rank' => 10,
        'popularity' => 20,
        'members' => 1000,
        'favorites' => 50,
        'images' => null,
        'trailer' => null,
        'external_links' => null,
    ];

    $ingestor->upsertEntity('anime', 1, $payload, $indexable, 'Finished');
    $ingestor->upsertEntity('anime', 1, $payload, $indexable, 'Finished');

    expect(DB::table('catalog_entities')->count())->toBe(1);
});
