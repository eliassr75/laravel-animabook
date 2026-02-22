<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Integrations\Jikan\Endpoints\RandomEndpoint;
use App\Models\CatalogEntity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RandomController extends Controller
{
    public function __invoke(Request $request, RandomEndpoint $randomEndpoint): Response
    {
        $useApi = $request->query('source') === 'api';

        $entity = null;
        if (! $useApi) {
            $entity = CatalogEntity::query()
                ->type('anime')
                ->inRandomOrder()
                ->first();
        }

        if (! $entity) {
            $payload = $randomEndpoint->anime();
            if ($payload === []) {
                return Inertia::render('CatalogDetail', [
                    'title' => 'Aleatório',
                    'entity' => null,
                ]);
            }

            return Inertia::render('AnimeDetail', [
                'entity' => $this->presentFromPayload($payload),
                'recommendations' => [],
                'reviews' => [],
                'characters' => [],
            ]);
        }

        return Inertia::render('AnimeDetail', [
            'entity' => [
                'malId' => $entity->mal_id,
                'title' => $entity->title,
                'titleJapanese' => data_get($entity->payload, 'title_japanese'),
                'score' => (float) ($entity->score ?? 0),
                'synopsis' => data_get($entity->payload, 'synopsis', $entity->synopsis_short),
                'genres' => collect(data_get($entity->payload, 'genres', []))
                    ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
                    ->filter()
                    ->values()
                    ->all(),
                'status' => $entity->status,
                'type' => data_get($entity->payload, 'type', ''),
                'episodes' => data_get($entity->payload, 'episodes'),
                'year' => $entity->year,
                'season' => $entity->season,
                'studios' => collect(data_get($entity->payload, 'studios', []))
                    ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
                    ->filter()
                    ->values()
                    ->all(),
                'members' => $entity->members ?? 0,
                'rank' => $entity->rank ?? 0,
                'colorIndex' => $entity->mal_id % 6,
                'imageUrl' => $entity->imageUrl(),
            ],
            'recommendations' => [],
            'reviews' => [],
            'characters' => [],
        ]);
    }

    private function presentFromPayload(array $payload): array
    {
        $imageUrl = data_get($payload, 'images.jpg.large_image_url')
            ?? data_get($payload, 'images.jpg.image_url')
            ?? data_get($payload, 'images.webp.large_image_url')
            ?? data_get($payload, 'images.webp.image_url')
            ?? data_get($payload, 'image_url');

        return [
            'malId' => (int) ($payload['mal_id'] ?? 0),
            'title' => $payload['title'] ?? $payload['title_english'] ?? 'Sem título',
            'titleJapanese' => $payload['title_japanese'] ?? null,
            'score' => (float) ($payload['score'] ?? 0),
            'synopsis' => $payload['synopsis'] ?? null,
            'genres' => collect($payload['genres'] ?? [])
                ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
                ->filter()
                ->values()
                ->all(),
            'status' => $payload['status'] ?? null,
            'type' => $payload['type'] ?? '',
            'episodes' => $payload['episodes'] ?? null,
            'year' => $payload['year'] ?? data_get($payload, 'aired.prop.from.year'),
            'season' => $payload['season'] ?? null,
            'studios' => collect($payload['studios'] ?? [])
                ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
                ->filter()
                ->values()
                ->all(),
            'members' => (int) ($payload['members'] ?? 0),
            'rank' => (int) ($payload['rank'] ?? 0),
            'colorIndex' => (int) (($payload['mal_id'] ?? 0) % 6),
            'imageUrl' => $imageUrl,
        ];
    }
}
