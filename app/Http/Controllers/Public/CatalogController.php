<?php

namespace App\Http\Controllers\Public;

use App\Domain\Catalog\CatalogRepository;
use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use App\Services\UserMediaActionsService;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function list(string $entityType, string $title, ?string $description = null, CatalogRepository $catalog, UserMediaActionsService $actions): Response
    {
        $filters = request()->only([
            'search',
            'year',
            'season',
            'status',
            'sort',
            'sort_dir',
            'genre',
            'type',
            'min_score',
            'max_score',
            'max_rank',
            'min_members',
            'year_from',
            'year_to',
            'has_image',
        ]);
        $items = $catalog->list($entityType, $filters, 24);

        $meta = [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'perPage' => $items->perPage(),
            'total' => $items->total(),
        ];

        $user = request()->user();
        $actionStates = [];
        if ($user && in_array($entityType, ['anime', 'manga'], true)) {
            $actionStates = $actions->statesFor($user, $entityType, $items->getCollection()->pluck('mal_id')->all());
        }

        return Inertia::render('CatalogList', [
            'entityType' => $entityType,
            'title' => $title,
            'description' => $description,
            'items' => $items->getCollection()->map(fn (CatalogEntity $entity) => $this->present($entity, $entityType, $actionStates[$entity->mal_id] ?? null)),
            'meta' => $meta,
            'filters' => $filters,
            'filterOptions' => $catalog->filterOptions($entityType),
        ]);
    }

    public function show(string $entityType, string $title, int $malId, UserMediaActionsService $actions): Response
    {
        $entity = CatalogEntity::query()
            ->type($entityType)
            ->where('mal_id', $malId)
            ->first();

        if (! $entity) {
            abort(404);
        }

        $relatedQuery = \App\Models\EntityRelation::query();

        if (in_array($entityType, ['genre', 'producer', 'magazine'], true)) {
            $relatedQuery
                ->where('to_type', $entityType)
                ->where('to_mal_id', $malId)
                ->whereIn('from_type', ['anime', 'manga']);
        } else {
            $relatedQuery
                ->where('from_type', $entityType)
                ->where('from_mal_id', $malId)
                ->whereIn('relation_type', ['recommendation', 'sequel', 'prequel', 'adaptation', 'character', 'staff', 'voice']);
        }

        $relatedIds = $relatedQuery->limit(12)->get();

        $relatedEntities = CatalogEntity::query()
            ->whereIn('mal_id', $relatedIds->pluck(in_array($entityType, ['genre', 'producer', 'magazine'], true) ? 'from_mal_id' : 'to_mal_id'))
            ->get()
            ->keyBy('mal_id');

        $related = $relatedIds->map(function (\App\Models\EntityRelation $relation) use ($relatedEntities, $entityType) {
            $targetId = in_array($entityType, ['genre', 'producer', 'magazine'], true)
                ? $relation->from_mal_id
                : $relation->to_mal_id;
            $entity = $relatedEntities->get($targetId);
            $type = in_array($entityType, ['genre', 'producer', 'magazine'], true)
                ? $relation->from_type
                : $relation->to_type;
            $meta = $relation->meta ?? [];
            $entry = $meta['entry'] ?? [];
            $metaImage = $this->imageFromRelationMeta($meta);

            return [
                'malId' => $targetId,
                'title' => $entity?->title ?? ($entry['title'] ?? $entry['name'] ?? '—'),
                'subtitle' => $relation->relation_type ?? $type,
                'type' => data_get($entity?->payload, 'type', $entry['type'] ?? null),
                'season' => $entity?->season ?? ($entry['season'] ?? null),
                'genreItems' => $entity
                    ? $this->pluckGenreItems(data_get($entity->payload, 'genres', []))
                    : [],
                'score' => $entity?->score,
                'status' => $entity?->status ?? ($entry['status'] ?? null),
                'year' => $entity?->year ?? ($entry['year'] ?? null),
                'imageUrl' => $entity?->imageUrl()
                    ?? $this->imageFromPayload($entry)
                    ?? $metaImage,
                'listHref' => in_array($type, ['anime', 'manga'], true) ? "/{$type}" : null,
                'mediaType' => in_array($type, ['anime', 'manga'], true) ? $type : null,
            ];
        })->values();

        $user = request()->user();
        $animeRelatedStates = $user
            ? $actions->statesFor($user, 'anime', $related->where('mediaType', 'anime')->pluck('malId')->all())
            : [];
        $mangaRelatedStates = $user
            ? $actions->statesFor($user, 'manga', $related->where('mediaType', 'manga')->pluck('malId')->all())
            : [];

        $related = $related->map(function (array $item) use ($animeRelatedStates, $mangaRelatedStates) {
            if (($item['mediaType'] ?? null) === 'anime') {
                $item['userActions'] = $animeRelatedStates[$item['malId']] ?? null;
            } elseif (($item['mediaType'] ?? null) === 'manga') {
                $item['userActions'] = $mangaRelatedStates[$item['malId']] ?? null;
            } else {
                $item['userActions'] = null;
            }

            return $item;
        })->values();

        return Inertia::render('CatalogDetail', [
            'title' => $title,
            'entityType' => $entityType,
            'entity' => $this->presentDetail(
                $entity,
                $entityType,
                $user && in_array($entityType, ['anime', 'manga'], true)
                    ? $actions->stateFor($user, $entityType, $entity->mal_id)
                    : null,
            ),
            'related' => $related,
        ]);
    }

    private function present(CatalogEntity $entity, string $entityType, ?array $userActions = null): array
    {
        $href = match ($entityType) {
            'manga' => "/manga/{$entity->mal_id}",
            'character' => "/characters/{$entity->mal_id}",
            'person' => "/people/{$entity->mal_id}",
            'producer' => "/producers/{$entity->mal_id}",
            'magazine' => "/magazines/{$entity->mal_id}",
            'genre' => "/genres/{$entity->mal_id}",
            'club' => "/clubs/{$entity->mal_id}",
            'watch' => "/watch/{$entity->mal_id}",
            default => "/anime/{$entity->mal_id}",
        };

        return [
            'malId' => $entity->mal_id,
            'title' => $entity->title,
            'subtitle' => data_get($entity->payload, 'type') ?? $entityType,
            'type' => data_get($entity->payload, 'type'),
            'season' => $entity->season,
            'genreItems' => in_array($entityType, ['anime', 'manga'], true)
                ? collect(data_get($entity->payload, 'genres', []))
                    ->map(fn ($item) => is_array($item)
                        ? ['id' => $item['mal_id'] ?? null, 'name' => $item['name'] ?? null]
                        : ['name' => $item]
                    )
                    ->filter(fn ($item) => ! empty($item['name']))
                    ->values()
                    ->all()
                : [],
            'score' => $entity->score,
            'status' => $entity->status,
            'year' => $entity->year,
            'imageUrl' => $entity->imageUrl(),
            'href' => $href,
            'listHref' => in_array($entityType, ['anime', 'manga'], true) ? "/{$entityType}" : null,
            'userActions' => $userActions,
            'mediaType' => in_array($entityType, ['anime', 'manga'], true) ? $entityType : null,
        ];
    }

    private function presentDetail(CatalogEntity $entity, string $entityType, ?array $userActions = null): array
    {
        return $this->present($entity, $entityType, $userActions) + [
            'synopsis' => data_get($entity->payload, 'synopsis', $entity->synopsis_short),
            'type' => data_get($entity->payload, 'type'),
            'season' => $entity->season,
            'genres' => $this->pluckGenreItems(data_get($entity->payload, 'genres', [])),
            'studios' => collect(data_get($entity->payload, 'studios', []))
                ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
                ->filter()
                ->values()
                ->all(),
            'stats' => array_values(array_filter([
                $entity->members ? ['label' => 'Membros', 'value' => number_format($entity->members)] : null,
                $entity->favorites ? ['label' => 'Favoritos', 'value' => number_format($entity->favorites)] : null,
                $entity->rank ? ['label' => 'Rank', 'value' => '#'.$entity->rank] : null,
                $entity->year ? ['label' => 'Ano', 'value' => (string) $entity->year] : null,
                $entity->status ? ['label' => 'Status', 'value' => (string) $entity->status] : null,
            ])),
            'externalLinks' => data_get($entity->payload, 'external', []),
        ];
    }

    private function imageFromPayload(?array $payload): ?string
    {
        if (! $payload) {
            return null;
        }

        $candidates = [
            data_get($payload, 'images.jpg.image_url'),
            data_get($payload, 'images.webp.image_url'),
            data_get($payload, 'images.jpg.large_image_url'),
            data_get($payload, 'images.webp.large_image_url'),
        ];

        foreach ($candidates as $url) {
            if (is_string($url) && $url !== '') {
                return $url;
            }
        }

        return null;
    }

    private function imageFromRelationMeta(?array $meta): ?string
    {
        if (! $meta) {
            return null;
        }

        return $this->imageFromPayload($meta['entry'] ?? null)
            ?? $this->imageFromPayload($meta['anime'] ?? null)
            ?? $this->imageFromPayload($meta['manga'] ?? null);
    }

    private function pluckGenreItems(array $items): array
    {
        return collect($items)
            ->map(function ($item) {
                if (is_array($item)) {
                    return [
                        'id' => $item['mal_id'] ?? null,
                        'name' => $item['name'] ?? null,
                    ];
                }
                return ['name' => $item];
            })
            ->filter(fn ($item) => ! empty($item['name']))
            ->values()
            ->all();
    }
}
