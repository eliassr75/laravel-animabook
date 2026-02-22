<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\WatchEndpoint;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class SeedWatchJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(WatchEndpoint $watchEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_watch', 1)) {
            return;
        }

        $episodes = array_merge(
            $watchEndpoint->recentEpisodes(),
            $watchEndpoint->popularEpisodes(),
        );

        foreach ($episodes as $episode) {
            if (! isset($episode['entry']['mal_id'], $episode['entry']['title'])) {
                continue;
            }

            $entry = $episode['entry'];
            $title = $entry['title'];
            $indexable = [
                'title' => $title,
                'title_normalized' => $this->normalizeTitle($title),
                'synopsis_short' => $episode['title'] ?? null,
                'year' => $episode['entry']['year'] ?? null,
                'season' => $episode['entry']['season'] ?? null,
                'status' => null,
                'rating' => null,
                'score' => $episode['entry']['score'] ?? null,
                'rank' => $episode['entry']['rank'] ?? null,
                'popularity' => $episode['entry']['popularity'] ?? null,
                'members' => $episode['entry']['members'] ?? null,
                'favorites' => $episode['entry']['favorites'] ?? null,
                'images' => $episode['entry']['images'] ?? null,
                'trailer' => null,
                'external_links' => null,
            ];

            app(Ingestor::class)->upsertEntity('watch', (int) $entry['mal_id'], $episode, $indexable, null);
        }
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }
}
