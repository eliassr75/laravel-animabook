<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\GenresEndpoint;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use App\Integrations\Jikan\RefreshPolicy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class SeedGenresJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(GenresEndpoint $genresEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_genres', 1)) {
            return;
        }

        $types = ['anime', 'manga'];

        foreach ($types as $type) {
            $genres = $genresEndpoint->list($type);

            foreach ($genres as $genre) {
                if (! isset($genre['mal_id'], $genre['name'])) {
                    continue;
                }

                $title = $genre['name'];
                $indexable = [
                    'title' => $title,
                    'title_normalized' => $this->normalizeTitle($title),
                    'synopsis_short' => null,
                    'year' => null,
                    'season' => null,
                    'status' => null,
                    'rating' => null,
                    'score' => null,
                    'rank' => null,
                    'popularity' => null,
                    'members' => null,
                    'favorites' => null,
                    'images' => null,
                    'trailer' => null,
                    'external_links' => null,
                ];

                app(Ingestor::class)->upsertEntity('genre', (int) $genre['mal_id'], $genre, $indexable, null);
            }
        }
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }
}
