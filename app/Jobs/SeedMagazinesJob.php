<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\MagazinesEndpoint;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class SeedMagazinesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(MagazinesEndpoint $magazinesEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_magazines', 1)) {
            return;
        }

        $items = $magazinesEndpoint->list(1);

        foreach ($items as $magazine) {
            if (! isset($magazine['mal_id'], $magazine['name'])) {
                continue;
            }

            $title = $magazine['name'];
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

            app(Ingestor::class)->upsertEntity('magazine', (int) $magazine['mal_id'], $magazine, $indexable, null);
        }
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }
}
