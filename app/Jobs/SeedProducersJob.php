<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\ProducersEndpoint;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class SeedProducersJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(ProducersEndpoint $producersEndpoint, IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_producers', 1)) {
            return;
        }

        $page = 1;
        $items = $producersEndpoint->list($page);

        foreach ($items as $producer) {
            if (! isset($producer['mal_id'], $producer['titles'][0]['title'])) {
                $name = $producer['name'] ?? null;
            } else {
                $name = $producer['titles'][0]['title'];
            }

            if (! $name || ! isset($producer['mal_id'])) {
                continue;
            }

            $indexable = $this->indexable($name);

            app(Ingestor::class)->upsertEntity('producer', (int) $producer['mal_id'], $producer, $indexable, null);
        }
    }

    private function indexable(string $title): array
    {
        return [
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
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }
}
