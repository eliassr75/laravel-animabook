<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\ClubsEndpoint;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class SeedClubsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(ClubsEndpoint $clubsEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_clubs', 1)) {
            return;
        }

        $items = $clubsEndpoint->list(1);

        foreach ($items as $club) {
            if (! isset($club['mal_id'], $club['title'])) {
                continue;
            }

            $title = $club['title'];
            $indexable = [
                'title' => $title,
                'title_normalized' => $this->normalizeTitle($title),
                'synopsis_short' => $club['about'] ?? null,
                'year' => null,
                'season' => null,
                'status' => null,
                'rating' => null,
                'score' => null,
                'rank' => null,
                'popularity' => null,
                'members' => $club['members'] ?? null,
                'favorites' => null,
                'images' => $club['images'] ?? null,
                'trailer' => null,
                'external_links' => null,
            ];

            app(Ingestor::class)->upsertEntity('club', (int) $club['mal_id'], $club, $indexable, null);
        }
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }
}
