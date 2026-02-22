<?php

use App\Jobs\SyncEntityJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('shows sync pending page for missing anime detail and enqueues sync once', function () {
    Cache::flush();
    Queue::fake();

    $response = $this->get('/anime/999999');

    $response->assertOk()->assertViewHas('page');
    $page = $response->viewData('page');
    expect($page['component'])->toBe('CatalogSyncPending');
    expect($page['props']['mediaType'])->toBe('anime');
    expect($page['props']['malId'])->toBe(999999);
    expect($page['props']['queuedNow'])->toBeTrue();

    Queue::assertPushed(SyncEntityJob::class, function (SyncEntityJob $job) {
        return $job->entityType === 'anime' && $job->malId === 999999;
    });

    $secondResponse = $this->get('/anime/999999');
    $secondResponse->assertOk()->assertViewHas('page');
    $secondPage = $secondResponse->viewData('page');
    expect($secondPage['component'])->toBe('CatalogSyncPending');
    expect($secondPage['props']['queuedNow'])->toBeFalse();

    Queue::assertPushed(SyncEntityJob::class, 1);
});

it('shows sync pending page for missing manga detail and enqueues sync job', function () {
    Cache::flush();
    Queue::fake();

    $response = $this->get('/manga/888888');

    $response->assertOk()->assertViewHas('page');
    $page = $response->viewData('page');
    expect($page['component'])->toBe('CatalogSyncPending');
    expect($page['props']['mediaType'])->toBe('manga');
    expect($page['props']['malId'])->toBe(888888);
    expect($page['props']['queuedNow'])->toBeTrue();

    Queue::assertPushed(SyncEntityJob::class, function (SyncEntityJob $job) {
        return $job->entityType === 'manga' && $job->malId === 888888;
    });
});
