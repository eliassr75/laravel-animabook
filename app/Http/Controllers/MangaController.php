<?php

namespace App\Http\Controllers;

use App\Domain\Catalog\CatalogRepository;
use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use App\Models\UserReview;
use App\Services\UserMediaActionsService;
use Inertia\Inertia;
use Inertia\Response;

class MangaController extends Controller
{
    public function index(CatalogRepository $catalog, UserMediaActionsService $actions): Response
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
        $items = $catalog->list('manga', $filters, 24);
        $user = request()->user();
        $actionStates = $user
            ? $actions->statesFor($user, 'manga', $items->getCollection()->pluck('mal_id')->all())
            : [];

        return Inertia::render('MangaList', [
            'items' => $items->getCollection()->map(fn (CatalogEntity $entity) => $this->present($entity, $actionStates[$entity->mal_id] ?? null)),
            'meta' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
            ],
            'filters' => $filters,
            'sort' => $filters['sort'] ?? null,
            'filterOptions' => $catalog->filterOptions('manga'),
        ]);
    }

    public function show(int $malId, CatalogRepository $catalog, UserMediaActionsService $actions): Response
    {
        $entity = $catalog->find('manga', $malId);

        if (! $entity) {
            abort(404);
        }

        $relationPayload = collect(data_get($entity->payload_full, 'relations', data_get($entity->payload, 'relations', [])));
        $relationCatalogMap = $this->relationCatalogMap($relationPayload);

        $recommendationIds = EntityRelation::query()
            ->where('from_type', 'manga')
            ->where('from_mal_id', $malId)
            ->where('relation_type', 'recommendation')
            ->orderByDesc('weight')
            ->limit(12)
            ->pluck('to_mal_id')
            ->all();

        $recommendations = CatalogEntity::query()
            ->type('manga')
            ->whereIn('mal_id', $recommendationIds)
            ->get();

        $user = request()->user();
        $recommendationStates = $user
            ? $actions->statesFor($user, 'manga', $recommendations->pluck('mal_id')->all())
            : [];

        $recommendations = $recommendations
            ->map(fn (CatalogEntity $item) => $this->present($item, $recommendationStates[$item->mal_id] ?? null))
            ->values();

        $payloadCharacters = data_get($entity->payload_full, 'characters', []);
        if (is_array($payloadCharacters) && count($payloadCharacters) > 0) {
            $characters = collect($payloadCharacters)
                ->take(12)
                ->map(function (array $character) {
                    $entry = $character['character'] ?? [];
                    $imageUrl = data_get($entry, 'images.jpg.image_url')
                        ?? data_get($entry, 'images.jpg.small_image_url')
                        ?? data_get($entry, 'images.webp.image_url')
                        ?? data_get($entry, 'images.webp.small_image_url')
                        ?? data_get($entry, 'image_url');

                    return [
                        'malId' => (int) ($entry['mal_id'] ?? 0),
                        'name' => $entry['name'] ?? '—',
                        'role' => $character['role'] ?? '—',
                        'mangaName' => '—',
                        'colorIndex' => ((int) ($entry['mal_id'] ?? 0)) % 6,
                        'imageUrl' => $imageUrl,
                    ];
                })
                ->values();
        } else {
            $characterRelations = EntityRelation::query()
                ->where('from_type', 'manga')
                ->where('from_mal_id', $malId)
                ->where('relation_type', 'character')
                ->limit(12)
                ->get();

            $characterEntities = CatalogEntity::query()
                ->type('character')
                ->whereIn('mal_id', $characterRelations->pluck('to_mal_id'))
                ->get()
                ->keyBy('mal_id');

            $characters = $characterRelations->map(function (EntityRelation $relation) use ($characterEntities) {
                $entity = $characterEntities->get($relation->to_mal_id);
                $role = $relation->meta['role'] ?? null;
                $imageUrl = $entity?->imageUrl()
                    ?? data_get($relation->meta, 'character.images.jpg.image_url')
                    ?? data_get($relation->meta, 'character.images.webp.image_url')
                    ?? data_get($relation->meta, 'character.image_url');

                return [
                    'malId' => $relation->to_mal_id,
                    'name' => $entity?->title ?? ($relation->meta['character']['name'] ?? '—'),
                    'role' => $role ?? ($relation->meta['role'] ?? '—'),
                    'mangaName' => '—',
                    'colorIndex' => $relation->to_mal_id % 6,
                    'imageUrl' => $imageUrl,
                ];
            })->values();
        }

        $externalReviews = EntityRelation::query()
            ->where('from_type', 'manga')
            ->where('from_mal_id', $malId)
            ->where('relation_type', 'review')
            ->orderByDesc('weight')
            ->limit(8)
            ->get()
            ->map(function (EntityRelation $relation) {
                $meta = $relation->meta ?? [];
                return [
                    'id' => $relation->to_mal_id,
                    'user' => data_get($meta, 'user.username', 'Usuário'),
                    'mangaTitle' => data_get($meta, 'manga.title', '—'),
                    'mangaMalId' => data_get($meta, 'manga.mal_id', 0),
                    'score' => (float) (data_get($meta, 'score', 0)),
                    'content' => data_get($meta, 'review', ''),
                    'date' => data_get($meta, 'date', ''),
                    'isMine' => false,
                    'mediaType' => 'manga',
                ];
            });

        $userReviews = UserReview::query()
            ->with('user:id,name')
            ->where('media_type', 'manga')
            ->where('mal_id', $malId)
            ->latest('updated_at')
            ->get()
            ->map(fn (UserReview $review) => [
                'id' => 900_000_000_000 + $review->id,
                'user' => $review->user?->name ?? 'Usuário',
                'mangaTitle' => $entity->title,
                'mangaMalId' => $entity->mal_id,
                'score' => (float) $review->score,
                'content' => $review->review,
                'date' => $review->updated_at?->toIso8601String(),
                'isMine' => $user ? $review->user_id === $user->id : false,
                'mediaType' => 'manga',
            ]);

        $reviews = $userReviews
            ->concat($externalReviews)
            ->sortByDesc(fn (array $item) => strtotime((string) ($item['date'] ?? '')))
            ->take(12)
            ->values();

        $myReview = $user
            ? UserReview::query()
                ->where('user_id', $user->id)
                ->where('media_type', 'manga')
                ->where('mal_id', $malId)
                ->first()
            : null;

        $news = $this->mergeNews(
            data_get($entity->payload_full, 'news', []),
            EntityRelation::query()
                ->where('from_type', 'manga')
                ->where('from_mal_id', $malId)
                ->where('relation_type', 'news')
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->pluck('meta')
                ->all(),
        );

        return Inertia::render('MangaDetail', [
            'malId' => $malId,
            'entity' => array_merge($this->presentDetail($entity), [
                'userActions' => $user ? $actions->stateFor($user, 'manga', $entity->mal_id) : null,
                'stats' => data_get($entity->payload_full, 'stats', []),
                'relations' => $relationPayload
                    ->map(function ($relationGroup) use ($relationCatalogMap) {
                        $relation = $relationGroup['relation'] ?? null;
                        $entries = collect($relationGroup['entry'] ?? [])
                            ->map(fn ($entry) => [
                                'malId' => $entry['mal_id'] ?? null,
                                'type' => $entry['type'] ?? null,
                                'name' => $entry['name'] ?? $entry['title'] ?? null,
                                'url' => $entry['url'] ?? null,
                                'href' => $this->relationHref($entry['type'] ?? null, $entry['mal_id'] ?? null),
                                'imageUrl' => $this->relationImage(
                                    $relationCatalogMap,
                                    $entry['type'] ?? null,
                                    isset($entry['mal_id']) ? (int) $entry['mal_id'] : null,
                                ),
                            ])
                            ->filter(fn ($entry) => ! empty($entry['name']))
                            ->values()
                            ->all();

                        return [
                            'relation' => $relation,
                            'entries' => $entries,
                        ];
                    })
                    ->filter(fn ($group) => ! empty($group['relation']) && ! empty($group['entries']))
                    ->values()
                    ->all(),
            ]),
            'recommendations' => $recommendations,
            'reviews' => $reviews,
            'myReview' => $myReview ? [
                'score' => (float) $myReview->score,
                'content' => $myReview->review,
                'isSpoiler' => (bool) $myReview->is_spoiler,
            ] : null,
            'news' => $news,
            'characters' => $characters,
        ]);
    }

    private function mergeNews(array $fromFull, array $fromRelations): array
    {
        return collect(array_merge($fromFull, $fromRelations))
            ->filter(fn ($item) => is_array($item))
            ->map(function (array $item) {
                $published = data_get($item, 'date', data_get($item, 'published', data_get($item, 'published_at')));

                return [
                    'id' => (int) ($item['mal_id'] ?? (abs(crc32((string) ($item['url'] ?? $item['title'] ?? ''))) ?: 0)),
                    'title' => (string) ($item['title'] ?? 'Sem título'),
                    'excerpt' => (string) ($item['excerpt'] ?? $item['intro'] ?? ''),
                    'url' => (string) ($item['url'] ?? ''),
                    'author' => (string) ($item['author_username'] ?? $item['author'] ?? ''),
                    'source' => (string) ($item['forum_url'] ?? ''),
                    'date' => is_string($published) ? $published : '',
                ];
            })
            ->filter(fn ($item) => $item['title'] !== 'Sem título')
            ->unique(fn ($item) => $item['url'] !== '' ? $item['url'] : "{$item['id']}:{$item['title']}")
            ->sortByDesc(fn ($item) => strtotime((string) $item['date']) ?: 0)
            ->take(12)
            ->values()
            ->all();
    }

    private function present(CatalogEntity $entity, ?array $userActions = null): array
    {
        return [
            'malId' => $entity->mal_id,
            'title' => $entity->title,
            'titleJapanese' => data_get($entity->payload, 'title_japanese'),
            'score' => (float) ($entity->score ?? 0),
            'synopsis' => $entity->synopsis_short,
            'genres' => $this->pluckNames(data_get($entity->payload, 'genres', [])),
            'status' => $entity->status,
            'type' => data_get($entity->payload, 'type', ''),
            'chapters' => data_get($entity->payload, 'chapters'),
            'volumes' => data_get($entity->payload, 'volumes'),
            'year' => $entity->year,
            'season' => $entity->season,
            'studios' => $this->pluckNames(data_get($entity->payload, 'studios', [])),
            'members' => $entity->members ?? 0,
            'rank' => $entity->rank ?? 0,
            'colorIndex' => $entity->mal_id % 6,
            'imageUrl' => $entity->imageUrl(),
            'userActions' => $userActions,
        ];
    }

    private function presentDetail(CatalogEntity $entity): array
    {
        return $this->present($entity) + [
            'synopsis' => data_get($entity->payload, 'synopsis', $entity->synopsis_short),
            'genreItems' => $this->pluckGenreItems(data_get($entity->payload, 'genres', [])),
        ];
    }

    private function pluckNames(array $items): array
    {
        return collect($items)
            ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
            ->filter()
            ->values()
            ->all();
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

    private function relationHref(?string $type, ?int $malId): ?string
    {
        if (! $type || ! $malId) {
            return null;
        }

        return match (strtolower($type)) {
            'anime' => "/anime/{$malId}",
            'manga' => "/manga/{$malId}",
            'character' => "/characters/{$malId}",
            'person' => "/people/{$malId}",
            'producer' => "/producers/{$malId}",
            'magazine' => "/magazines/{$malId}",
            'club' => "/clubs/{$malId}",
            default => null,
        };
    }

    private function relationCatalogMap(\Illuminate\Support\Collection $relationPayload): array
    {
        $byType = [];

        $relationPayload
            ->pluck('entry')
            ->flatten(1)
            ->each(function ($entry) use (&$byType) {
                $type = strtolower((string) ($entry['type'] ?? ''));
                $malId = isset($entry['mal_id']) ? (int) $entry['mal_id'] : 0;
                if (! $type || $malId <= 0) {
                    return;
                }
                $byType[$type][] = $malId;
            });

        $map = [];
        foreach ($byType as $type => $ids) {
            CatalogEntity::query()
                ->type($type)
                ->whereIn('mal_id', array_values(array_unique($ids)))
                ->get()
                ->each(function (CatalogEntity $entity) use (&$map, $type) {
                    $map["{$type}:{$entity->mal_id}"] = $entity->imageUrl();
                });
        }

        return $map;
    }

    private function relationImage(array $map, ?string $type, ?int $malId): ?string
    {
        if (! $type || ! $malId) {
            return null;
        }

        return $map[strtolower($type).":{$malId}"] ?? null;
    }
}
