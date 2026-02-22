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
            $results = $searchEndpoint->anime($query, 1);

            foreach ($results as $item) {
                if (! isset($item['mal_id'])) {
                    continue;
                }

                SyncEntityJob::dispatch('anime', (int) $item['mal_id'])->onQueue('low');
            }
        }

        $recommendations = $recommendationsEndpoint->anime(1);

        foreach ($recommendations as $rec) {
            $entry = $rec['entry'] ?? null;
            if (! $entry) {
                continue;
            }

            foreach ($entry as $item) {
                if (! isset($item['mal_id'])) {
                    continue;
                }

                SyncEntityJob::dispatch('anime', (int) $item['mal_id'])->onQueue('low');
            }

            if (isset($rec['mal_id'])) {
                SyncEntityJob::dispatch('anime', (int) $rec['mal_id'])->onQueue('low');
            }
        }

        $reviews = $reviewsEndpoint->anime(1);

        foreach ($reviews as $review) {
            if (! isset($review['anime']['mal_id'])) {
                continue;
            }

            SyncEntityJob::dispatch('anime', (int) $review['anime']['mal_id'])->onQueue('low');
        }
    }
}
