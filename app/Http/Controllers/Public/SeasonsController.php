<?php

namespace App\Http\Controllers\Public;

use App\Domain\Catalog\CatalogRepository;
use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use Inertia\Inertia;
use Inertia\Response;

class SeasonsController extends Controller
{
    public function __invoke(CatalogRepository $catalog): Response
    {
        $filters = request()->only(['search', 'year', 'season', 'status', 'sort', 'genre', 'type']);
        $filters['has_season'] = true;
        if (! isset($filters['sort'])) {
            $filters['sort'] = 'year';
        }
        $items = $catalog->list('anime', $filters, 24);

        return Inertia::render('CatalogList', [
            'title' => 'Temporadas',
            'description' => 'Navegue pelos animes de cada temporada e ano.',
            'items' => $items->getCollection()->map(fn (CatalogEntity $entity) => [
                'malId' => $entity->mal_id,
                'title' => $entity->title,
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
