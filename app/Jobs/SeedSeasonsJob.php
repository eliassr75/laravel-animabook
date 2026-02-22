<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\SeasonsEndpoint;
use App\Integrations\Jikan\IngestBudget;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SeedSeasonsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('high');
    }

    public function handle(SeasonsEndpoint $seasonsEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_seasons', 1)) {
            return;
        }

        $current = $seasonsEndpoint->current();
        $upcoming = $seasonsEndpoint->upcoming();

        foreach (array_merge($current, $upcoming) as $item) {
            if (! isset($item['mal_id'])) {
                continue;
            }

            SyncEntityJob::dispatch('anime', (int) $item['mal_id'])->onQueue('high');
        }
    }
}
