<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\SearchEndpoint;
use App\Integrations\Jikan\Endpoints\RecommendationsEndpoint;
use App\Integrations\Jikan\Endpoints\ReviewsEndpoint;
use App\Integrations\Jikan\IngestBudget;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SeedDiscoveryJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(
        SearchEndpoint $searchEndpoint,
        RecommendationsEndpoint $recommendationsEndpoint,
        ReviewsEndpoint $reviewsEndpoint,
        IngestBudget $budget
    ): void
    {
        if (! $budget->withinBudget('seed_discovery', 1)) {
            return;
        }

        $queries = ['a', 'b', 'c'];

        foreach ($queries as $query) {
            foreach ($searchEndpoint->anime($query, 1) as $item) {
                $malId = (int) ($item['mal_id'] ?? 0);
                if ($malId <= 0) {
                    continue;
                }

                SyncEntityJob::dispatch('anime', $malId)->onQueue('low');
            }

            foreach ($searchEndpoint->manga($query, 1) as $item) {
                $malId = (int) ($item['mal_id'] ?? 0);
                if ($malId <= 0) {
                    continue;
                }

                SyncEntityJob::dispatch('manga', $malId)->onQueue('low');
            }
        }

        foreach ($recommendationsEndpoint->anime(1) as $rec) {
            $entry = $rec['entry'] ?? null;
            if (! is_array($entry)) {
                continue;
            }

            foreach ($entry as $item) {
                $malId = (int) ($item['mal_id'] ?? 0);
                if ($malId <= 0) {
                    continue;
                }

                SyncEntityJob::dispatch('anime', $malId)->onQueue('low');
            }

            $malId = (int) ($rec['mal_id'] ?? 0);
            if ($malId > 0) {
                SyncEntityJob::dispatch('anime', $malId)->onQueue('low');
            }
        }

        foreach ($recommendationsEndpoint->manga(1) as $rec) {
            $entry = $rec['entry'] ?? null;
            if (! is_array($entry)) {
                continue;
            }

            foreach ($entry as $item) {
                $malId = (int) ($item['mal_id'] ?? 0);
                if ($malId <= 0) {
                    continue;
                }

                SyncEntityJob::dispatch('manga', $malId)->onQueue('low');
            }

            $malId = (int) ($rec['mal_id'] ?? 0);
            if ($malId > 0) {
                SyncEntityJob::dispatch('manga', $malId)->onQueue('low');
            }
        }

        foreach ($reviewsEndpoint->anime(1) as $review) {
            $malId = (int) data_get($review, 'anime.mal_id', 0);
            if ($malId <= 0) {
                continue;
            }

            SyncEntityJob::dispatch('anime', $malId)->onQueue('low');
        }

        foreach ($reviewsEndpoint->manga(1) as $review) {
            $malId = (int) data_get($review, 'manga.mal_id', 0);
            if ($malId <= 0) {
                continue;
            }

            SyncEntityJob::dispatch('manga', $malId)->onQueue('low');
        }
    }
}
