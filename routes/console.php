<?php

use App\Jobs\BackfillAnimeCatalogJob;
use App\Jobs\BackfillMangaCatalogJob;
use App\Jobs\RefreshPlannerJob;
use App\Jobs\SeedClubsJob;
use App\Jobs\SeedDiscoveryJob;
use App\Jobs\SeedGenresJob;
use App\Jobs\SeedMagazinesJob;
use App\Jobs\SeedPeopleFromRelationsJob;
use App\Jobs\SeedProducersJob;
use App\Jobs\SeedSeasonsJob;
use App\Jobs\SeedTopJob;
use App\Jobs\SeedWatchJob;
use App\Jobs\SyncEntityJob;
use App\Models\CatalogEntity;
use App\Models\IngestCursor;
use App\Services\SitemapService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('catalog:seed-initial', function () {
    SeedTopJob::dispatch();
    SeedSeasonsJob::dispatch();
    SeedDiscoveryJob::dispatch();
    SeedGenresJob::dispatch();
    SeedProducersJob::dispatch();
    SeedMagazinesJob::dispatch();
    SeedClubsJob::dispatch();
    SeedWatchJob::dispatch();
    SeedPeopleFromRelationsJob::dispatch();

    $this->info('Seed jobs dispatched.');
})->purpose('Dispatch initial catalog seed jobs');

Artisan::command('catalog:backfill-anime:start {--from=} {--batch=} {--cursor=anime_backfill}', function () {
    $cursorName = (string) ($this->option('cursor') ?? 'anime_backfill');
    $from = (int) ($this->option('from') ?? 0);
    $batch = (int) ($this->option('batch') ?? 0);
    $batch = $batch > 0
        ? $batch
        : (int) config('animabook.backfill_anime.batch_size', 50);
    $batch = max(1, min(500, $batch));

    $cursor = IngestCursor::query()->firstOrCreate(
        ['name' => $cursorName],
        [
            'next_mal_id' => max(1, (int) config('animabook.backfill_anime.start_mal_id', 1)),
            'last_valid_mal_id' => null,
            'consecutive_misses' => 0,
            'is_active' => false,
            'meta' => [],
        ],
    );

    if ($from > 0) {
        $cursor->next_mal_id = max(1, $from);
        $cursor->consecutive_misses = 0;
    }

    $cursor->is_active = true;
    $cursor->meta = array_merge($cursor->meta ?? [], [
        'batch_size' => $batch,
        'started_at' => now()->toIso8601String(),
        'family' => 'anime_backfill',
    ]);
    $cursor->save();

    BackfillAnimeCatalogJob::dispatch($cursorName, $batch)
        ->onQueue((string) config('animabook.backfill_anime.queue', 'low'));

    $this->info("Backfill anime iniciado: cursor={$cursorName}, next_mal_id={$cursor->next_mal_id}, batch={$batch}.");
})->purpose('Start or resume continuous anime catalog backfill');

Artisan::command('catalog:backfill-anime:stop {--cursor=anime_backfill}', function () {
    $cursorName = (string) ($this->option('cursor') ?? 'anime_backfill');
    $cursor = IngestCursor::query()->where('name', $cursorName)->first();

    if (! $cursor) {
        $this->warn("Cursor {$cursorName} não encontrado.");
        return;
    }

    $cursor->is_active = false;
    $cursor->save();

    $this->info("Backfill anime pausado: cursor={$cursorName}.");
})->purpose('Stop continuous anime catalog backfill');

Artisan::command('catalog:backfill-anime:status {--cursor=anime_backfill}', function () {
    $cursorName = (string) ($this->option('cursor') ?? 'anime_backfill');
    $cursor = IngestCursor::query()->where('name', $cursorName)->first();

    if (! $cursor) {
        $this->warn("Cursor {$cursorName} não encontrado.");
        return;
    }

    $this->line("cursor: {$cursor->name}");
    $this->line('is_active: '.($cursor->is_active ? 'yes' : 'no'));
    $this->line('next_mal_id: '.(int) $cursor->next_mal_id);
    $this->line('last_valid_mal_id: '.($cursor->last_valid_mal_id ? (int) $cursor->last_valid_mal_id : '-'));
    $this->line('consecutive_misses: '.(int) $cursor->consecutive_misses);
    $this->line('last_ran_at: '.($cursor->last_ran_at?->toIso8601String() ?? '-'));
    $this->line('last_error: '.($cursor->last_error ?? '-'));
})->purpose('Show anime backfill cursor status');

Artisan::command('catalog:backfill-anime:tick', function () {
    $queue = (string) config('animabook.backfill_anime.queue', 'low');
    $defaultBatch = max(1, min(500, (int) config('animabook.backfill_anime.batch_size', 50)));

    IngestCursor::query()
        ->where('is_active', true)
        ->get()
        ->filter(function (IngestCursor $cursor): bool {
            if (data_get($cursor->meta, 'family') === 'anime_backfill') {
                return true;
            }

            return $cursor->name === 'anime_backfill' || str_starts_with($cursor->name, 'anime_backfill:');
        })
        ->each(function (IngestCursor $cursor) use ($queue, $defaultBatch): void {
            $batchFromMeta = (int) data_get($cursor->meta, 'batch_size', $defaultBatch);
            $batch = max(1, min(500, $batchFromMeta));

            BackfillAnimeCatalogJob::dispatch($cursor->name, $batch)->onQueue($queue);
        });
})->purpose('Keep active anime backfill cursors running');

Artisan::command('catalog:backfill-manga:start {--from=} {--batch=} {--cursor=manga_backfill}', function () {
    $cursorName = (string) ($this->option('cursor') ?? 'manga_backfill');
    $from = (int) ($this->option('from') ?? 0);
    $batch = (int) ($this->option('batch') ?? 0);
    $batch = $batch > 0
        ? $batch
        : (int) config('animabook.backfill_manga.batch_size', 50);
    $batch = max(1, min(500, $batch));

    $cursor = IngestCursor::query()->firstOrCreate(
        ['name' => $cursorName],
        [
            'next_mal_id' => max(1, (int) config('animabook.backfill_manga.start_mal_id', 1)),
            'last_valid_mal_id' => null,
            'consecutive_misses' => 0,
            'is_active' => false,
            'meta' => [],
        ],
    );

    if ($from > 0) {
        $cursor->next_mal_id = max(1, $from);
        $cursor->consecutive_misses = 0;
    }

    $cursor->is_active = true;
    $cursor->meta = array_merge($cursor->meta ?? [], [
        'batch_size' => $batch,
        'started_at' => now()->toIso8601String(),
        'family' => 'manga_backfill',
    ]);
    $cursor->save();

    BackfillMangaCatalogJob::dispatch($cursorName, $batch)
        ->onQueue((string) config('animabook.backfill_manga.queue', 'low'));

    $this->info("Backfill mangá iniciado: cursor={$cursorName}, next_mal_id={$cursor->next_mal_id}, batch={$batch}.");
})->purpose('Start or resume continuous manga catalog backfill');

Artisan::command('catalog:backfill-manga:stop {--cursor=manga_backfill}', function () {
    $cursorName = (string) ($this->option('cursor') ?? 'manga_backfill');
    $cursor = IngestCursor::query()->where('name', $cursorName)->first();

    if (! $cursor) {
        $this->warn("Cursor {$cursorName} não encontrado.");
        return;
    }

    $cursor->is_active = false;
    $cursor->save();

    $this->info("Backfill mangá pausado: cursor={$cursorName}.");
})->purpose('Stop continuous manga backfill');

Artisan::command('catalog:backfill-manga:status {--cursor=manga_backfill}', function () {
    $cursorName = (string) ($this->option('cursor') ?? 'manga_backfill');
    $cursor = IngestCursor::query()->where('name', $cursorName)->first();

    if (! $cursor) {
        $this->warn("Cursor {$cursorName} não encontrado.");
        return;
    }

    $this->line("cursor: {$cursor->name}");
    $this->line('is_active: '.($cursor->is_active ? 'yes' : 'no'));
    $this->line('next_mal_id: '.(int) $cursor->next_mal_id);
    $this->line('last_valid_mal_id: '.($cursor->last_valid_mal_id ? (int) $cursor->last_valid_mal_id : '-'));
    $this->line('consecutive_misses: '.(int) $cursor->consecutive_misses);
    $this->line('last_ran_at: '.($cursor->last_ran_at?->toIso8601String() ?? '-'));
    $this->line('last_error: '.($cursor->last_error ?? '-'));
})->purpose('Show manga backfill cursor status');

Artisan::command('catalog:backfill-manga:tick', function () {
    $queue = (string) config('animabook.backfill_manga.queue', 'low');
    $defaultBatch = max(1, min(500, (int) config('animabook.backfill_manga.batch_size', 50)));

    IngestCursor::query()
        ->where('is_active', true)
        ->get()
        ->filter(function (IngestCursor $cursor): bool {
            if (data_get($cursor->meta, 'family') === 'manga_backfill') {
                return true;
            }

            return $cursor->name === 'manga_backfill' || str_starts_with($cursor->name, 'manga_backfill:');
        })
        ->each(function (IngestCursor $cursor) use ($queue, $defaultBatch): void {
            $batchFromMeta = (int) data_get($cursor->meta, 'batch_size', $defaultBatch);
            $batch = max(1, min(500, $batchFromMeta));

            BackfillMangaCatalogJob::dispatch($cursor->name, $batch)->onQueue($queue);
        });
})->purpose('Keep active manga backfill cursors running');

Artisan::command('catalog:refresh-anime-full {--limit=} {--from=} {--queue=default}', function () {
    $limit = (int) ($this->option('limit') ?? 0);
    $from = (int) ($this->option('from') ?? 0);
    $queue = (string) ($this->option('queue') ?? 'default');

    $query = CatalogEntity::query()->type('anime')->orderBy('mal_id');

    if ($from > 0) {
        $query->where('mal_id', '>=', $from);
    }

    if ($limit > 0) {
        $query->limit($limit);
    }

    $count = 0;

    $query->chunkById(200, function ($items) use (&$count, $limit, $queue) {
        foreach ($items as $entity) {
            SyncEntityJob::dispatch('anime', $entity->mal_id)->onQueue($queue);
            $count++;

            if ($limit > 0 && $count >= $limit) {
                return false;
            }
        }

        return true;
    }, 'id');

    $this->info("Dispatched {$count} anime sync jobs.");
})->purpose('Dispatch sync jobs to refresh anime full payloads');

Artisan::command('catalog:refresh-manga-full {--limit=} {--from=} {--queue=default}', function () {
    $limit = (int) ($this->option('limit') ?? 0);
    $from = (int) ($this->option('from') ?? 0);
    $queue = (string) ($this->option('queue') ?? 'default');

    $query = \App\Models\CatalogEntity::query()
        ->where('entity_type', 'manga')
        ->orderBy('mal_id');

    if ($from > 0) {
        $query->where('mal_id', '>=', $from);
    }

    if ($limit > 0) {
        $query->limit($limit);
    }

    $query->pluck('mal_id')->each(function (int $malId) use ($queue) {
        \App\Jobs\SyncEntityJob::dispatch('manga', $malId)->onQueue($queue);
    });
})->purpose('Dispatch sync jobs to refresh manga full payloads');

Artisan::command('seo:sitemap:refresh {--write-file}', function (SitemapService $sitemap) {
    $result = $sitemap->refresh((bool) $this->option('write-file'));

    $this->info('Sitemap updated.');
    $this->line('URLs: '.$result['url_count']);
    $this->line('Written file: '.($result['written'] ? 'yes' : 'no'));
})->purpose('Refresh sitemap cache and optionally write /public/sitemap.xml');

Schedule::job(new SeedTopJob)->everyFifteenMinutes();
Schedule::job(new SeedSeasonsJob)->everyThirtyMinutes();
Schedule::job(new RefreshPlannerJob)->dailyAt('01:00');
Schedule::job(new SeedDiscoveryJob)->dailyAt('03:00');
Schedule::job(new SeedGenresJob)->dailyAt('04:00');
Schedule::job(new SeedProducersJob)->weekly()->at('05:00');
Schedule::job(new SeedMagazinesJob)->weekly()->at('05:30');
Schedule::job(new SeedClubsJob)->weekly()->at('06:00');
Schedule::job(new SeedWatchJob)->dailyAt('06:30');
Schedule::job(new SeedPeopleFromRelationsJob)->dailyAt('02:30');
Schedule::command('catalog:backfill-anime:tick')->everyMinute();
Schedule::command('catalog:backfill-manga:tick')->everyMinute();
Schedule::command('seo:sitemap:refresh --write-file')->everyThirtyMinutes();
