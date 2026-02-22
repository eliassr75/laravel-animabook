<?php

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
Schedule::job(new SeedWatchJob)->hourly();
Schedule::job(new SeedPeopleFromRelationsJob)->dailyAt('02:30');
Schedule::command('seo:sitemap:refresh --write-file')->everyThirtyMinutes();
