<?php

use App\Jobs\RefreshHomePageSnapshotJob;
use App\Models\MetricSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Queue;

it('creates a materialized snapshot on the first home request', function () {
    expect(MetricSnapshot::query()->count())->toBe(0);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Index'));

    $snapshot = MetricSnapshot::query()
        ->where('metric_key', \App\Services\HomePageSnapshotService::SNAPSHOT_KEY)
        ->first();

    expect($snapshot)->not->toBeNull();
    expect($snapshot?->generated_at)->not->toBeNull();
    expect($snapshot?->refresh_after)->not->toBeNull();
});

it('serves the stored snapshot and queues a refresh when it is stale', function () {
    Queue::fake();

    MetricSnapshot::query()->create([
        'metric_key' => \App\Services\HomePageSnapshotService::SNAPSHOT_KEY,
        'payload' => [
            'topAnime' => [],
            'currentSeason' => [],
            'recommendations' => [],
            'recentReviews' => [],
            'recentNews' => [],
            'baseStats' => [
                'counts' => [
                    'anime' => 321,
                ],
                'statusDistribution' => [
                    'anime' => [],
                    'manga' => [],
                ],
                'topGenres' => [],
                'ingestTrend' => [],
                'quality' => [
                    'withImage' => 0,
                    'withSynopsis' => 0,
                    'withScore' => 0,
                    'catalogTotal' => 0,
                ],
            ],
        ],
        'generated_at' => CarbonImmutable::parse('2026-03-22 10:00:00'),
        'refresh_after' => now()->subMinute(),
    ]);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Index')
        ->where('baseStats.counts.anime', 321));

    Queue::assertPushed(RefreshHomePageSnapshotJob::class);
});
