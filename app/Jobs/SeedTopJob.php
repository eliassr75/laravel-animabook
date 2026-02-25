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

        $animePages = max(1, (int) config('animabook.seed_top.anime_pages', 1));
        $mangaPages = max(1, (int) config('animabook.seed_top.manga_pages', 5));

        $seenAnime = [];
        $seenManga = [];

        for ($page = 1; $page <= $animePages; $page++) {
            $top = $topEndpoint->anime($page);
            if ($top === []) {
                break;
            }

            foreach ($top as $item) {
                $malId = (int) ($item['mal_id'] ?? 0);
                if ($malId <= 0 || isset($seenAnime[$malId])) {
                    continue;
                }

                $seenAnime[$malId] = true;
                SyncEntityJob::dispatch('anime', $malId)->onQueue('high');
            }
        }

        for ($page = 1; $page <= $mangaPages; $page++) {
            $topManga = $topEndpoint->manga($page);
            if ($topManga === []) {
                break;
            }

            foreach ($topManga as $item) {
                $malId = (int) ($item['mal_id'] ?? 0);
                if ($malId <= 0 || isset($seenManga[$malId])) {
                    continue;
                }

                $seenManga[$malId] = true;
                SyncEntityJob::dispatch('manga', $malId)->onQueue('high');
            }
        }
    }
}
