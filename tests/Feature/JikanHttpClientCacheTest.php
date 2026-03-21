<?php

use App\Integrations\Jikan\Endpoints\AnimeEndpoint;
use App\Integrations\Jikan\Endpoints\RandomEndpoint;
use App\Models\JikanCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('caches deterministic jikan responses in the jikan_cache table', function () {
    config()->set('jikan.cache.enabled', true);
    config()->set('jikan.retry_times', 0);
    config()->set('jikan.max_concurrency', 0);
    config()->set('jikan.min_interval_ms', 0);

    Http::fake([
        '*' => Http::response([
            'data' => [
                'mal_id' => 1,
                'title' => 'Cowboy Bebop',
            ],
        ], 200),
    ]);

    $endpoint = app(AnimeEndpoint::class);

    expect($endpoint->getById(1)['title'])->toBe('Cowboy Bebop');
    expect($endpoint->getById(1)['title'])->toBe('Cowboy Bebop');

    Http::assertSentCount(1);

    $entry = JikanCache::query()->first();

    expect($entry)->not->toBeNull()
        ->and($entry->endpoint)->toBe('anime/1')
        ->and($entry->status_code)->toBe(200);
});

it('does not cache random jikan endpoints', function () {
    config()->set('jikan.cache.enabled', true);
    config()->set('jikan.retry_times', 0);
    config()->set('jikan.max_concurrency', 0);
    config()->set('jikan.min_interval_ms', 0);

    Http::fake([
        '*' => Http::response([
            'data' => [
                'mal_id' => 99,
            ],
        ], 200),
    ]);

    $endpoint = app(RandomEndpoint::class);

    $endpoint->anime();
    $endpoint->anime();

    Http::assertSentCount(2);
    expect(JikanCache::query()->count())->toBe(0);
});
