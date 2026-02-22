<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\TopEndpoint;
use App\Integrations\Jikan\IngestBudget;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SeedTopJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('high');
    }

    public function handle(TopEndpoint $topEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_top', 1)) {
            return;
        }

        $top = $topEndpoint->anime(1);
        $topManga = $topEndpoint->manga(1);

        foreach ($top as $item) {
            if (! isset($item['mal_id'])) {
                continue;
            }

            SyncEntityJob::dispatch('anime', (int) $item['mal_id'])->onQueue('high');
        }

        foreach ($topManga as $item) {
            if (! isset($item['mal_id'])) {
                continue;
            }

            SyncEntityJob::dispatch('manga', (int) $item['mal_id'])->onQueue('high');
        }
    }
}
