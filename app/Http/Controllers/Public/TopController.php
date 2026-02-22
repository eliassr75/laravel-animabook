<?php

namespace App\Http\Controllers\Public;

use App\Domain\Catalog\CatalogRepository;
use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use Inertia\Inertia;
use Inertia\Response;

class TopController extends Controller
{
    public function __invoke(CatalogRepository $catalog): Response
    {
        $filters = request()->only(['search', 'year', 'season', 'status', 'sort', 'sort_dir', 'genre', 'type', 'min_rank', 'max_rank']);
        if (! isset($filters['sort'])) {
            $filters['sort'] = 'rank';
        }
        $filters['min_rank'] = max(1, (int) ($filters['min_rank'] ?? 1));

        $items = $catalog->list('anime', $filters, 24);

        return Inertia::render('CatalogList', [
            'title' => 'Top Anime',
            'description' => 'Ranking dos melhores animes de todos os tempos.',
            'items' => $items->getCollection()->map(fn (CatalogEntity $entity) => [
                'malId' => $entity->mal_id,
                'title' => $entity->title,
                'rank' => $entity->rank,
                'subtitle' => data_get($entity->payload, 'type'),
                'type' => data_get($entity->payload, 'type'),
                'season' => $entity->season,
                'score' => $entity->score,
                'status' => $entity->status,
                'year' => $entity->year,
                'imageUrl' => $entity->imageUrl(),
            ]),
            'meta' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
            ],
            'filters' => $filters,
            'filterOptions' => $catalog->filterOptions('anime'),
        ]);
    }
}
