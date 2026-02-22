<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use Inertia\Inertia;
use Inertia\Response;

class VoteController extends Controller
{
    public function __invoke(): Response
    {
        $searchIndex = CatalogEntity::query()
            ->type('anime')
            ->orderByDesc('score')
            ->limit(200)
            ->get()
            ->map(function (CatalogEntity $entity) {
                return [
                    'malId' => $entity->mal_id,
                    'title' => $entity->title,
                    'titleJapanese' => data_get($entity->payload, 'title_japanese'),
                    'score' => (float) ($entity->score ?? 0),
                    'synopsis' => $entity->synopsis_short,
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
                ];
            });

        return Inertia::render('Vote', [
            'searchIndex' => $searchIndex,
        ]);
    }
}
