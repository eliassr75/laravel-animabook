<?php

namespace App\Http\Controllers;

use App\Domain\Catalog\CatalogRepository;
use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use App\Models\UserMediaStatus;
use App\Models\UserReview;
use App\Services\UserMediaActionsService;
use Inertia\Inertia;
use Inertia\Response;

class AnimeController extends Controller
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
        $items = $catalog->list('anime', $filters, 24);
        $user = request()->user();
        $actionStates = $user
            ? $actions->statesFor($user, 'anime', $items->getCollection()->pluck('mal_id')->all())
            : [];

        return Inertia::render('AnimeList', [
            'items' => $items->getCollection()->map(fn (CatalogEntity $entity) => $this->present($entity, $actionStates[$entity->mal_id] ?? null)),
            'meta' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
            ],
            'filters' => $filters,
            'sort' => $filters['sort'] ?? null,
            'filterOptions' => $catalog->filterOptions('anime'),
        ]);
    }

    public function show(int $malId, CatalogRepository $catalog, UserMediaActionsService $actions): Response
    {
        $entity = $catalog->find('anime', $malId);

        if (! $entity) {
            abort(404);
        }

        $full = $entity->payload_full ?? [];
        $relationPayload = collect(data_get($full, 'relations', []));
        $relationCatalogMap = $this->relationCatalogMap($relationPayload);

        $recommendationIds = \App\Models\EntityRelation::query()
            ->where('from_type', 'anime')
            ->where('from_mal_id', $malId)
            ->where('relation_type', 'recommendation')
            ->orderByDesc('weight')
            ->limit(12)
            ->pluck('to_mal_id')
            ->all();

        $recommendations = \App\Models\CatalogEntity::query()
            ->type('anime')
            ->whereIn('mal_id', $recommendationIds)
            ->get();

        $user = request()->user();
        $userStatus = $user
            ? UserMediaStatus::query()
                ->where('user_id', $user->id)
                ->where('media_type', 'anime')
                ->where('mal_id', $malId)
                ->first()
            : null;
        $recommendationStates = $user
            ? $actions->statesFor($user, 'anime', $recommendations->pluck('mal_id')->all())
            : [];

        $recommendations = $recommendations
            ->map(fn (\App\Models\CatalogEntity $item) => $this->present($item, $recommendationStates[$item->mal_id] ?? null))
            ->values();

        $characterRelations = \App\Models\EntityRelation::query()
            ->where('from_type', 'anime')
            ->where('from_mal_id', $malId)
            ->where('relation_type', 'character')
            ->limit(12)
            ->get();

        $characterEntities = \App\Models\CatalogEntity::query()
            ->type('character')
            ->whereIn('mal_id', $characterRelations->pluck('to_mal_id'))
            ->get()
            ->keyBy('mal_id');

        $characters = collect(data_get($full, 'characters', []));

        if ($characters->isNotEmpty()) {
            $characters = $characters->take(12)->map(function ($item) {
                return [
                    'malId' => data_get($item, 'character.mal_id'),
                    'name' => data_get($item, 'character.name', '—'),
                    'role' => data_get($item, 'role', '—'),
                    'animeName' => '—',
                    'imageUrl' => data_get($item, 'character.images.jpg.image_url')
                        ?? data_get($item, 'character.images.webp.image_url'),
                    'colorIndex' => (int) (data_get($item, 'character.mal_id') ?? 0) % 6,
                ];
            })->values();
        } else {
            $characters = $characterRelations->map(function (\App\Models\EntityRelation $relation) use ($characterEntities) {
                $entity = $characterEntities->get($relation->to_mal_id);
                $role = $relation->meta['role'] ?? null;

                return [
                    'malId' => $relation->to_mal_id,
                    'name' => $entity?->title ?? ($relation->meta['character']['name'] ?? '—'),
                    'role' => $role ?? ($relation->meta['role'] ?? '—'),
                    'animeName' => '—',
                    'imageUrl' => $entity?->imageUrl(),
                    'colorIndex' => $relation->to_mal_id % 6,
                ];
            })->values();
        }

        $externalReviews = EntityRelation::query()
            ->where('from_type', 'anime')
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
                    'animeTitle' => data_get($meta, 'anime.title', '—'),
                    'animeMalId' => data_get($meta, 'anime.mal_id', 0),
                    'score' => (float) (data_get($meta, 'score', 0)),
                    'content' => data_get($meta, 'review', ''),
                    'date' => data_get($meta, 'date', ''),
                    'isMine' => false,
                    'mediaType' => 'anime',
                ];
            });

        $userReviews = UserReview::query()
            ->with('user:id,name')
            ->where('media_type', 'anime')
            ->where('mal_id', $malId)
            ->latest('updated_at')
            ->get()
            ->map(fn (UserReview $review) => [
                'id' => 900_000_000_000 + $review->id,
                'user' => $review->user?->name ?? 'Usuário',
                'animeTitle' => $entity->title,
                'animeMalId' => $entity->mal_id,
                'score' => (float) $review->score,
                'content' => $review->review,
                'date' => $review->updated_at?->toIso8601String(),
                'isMine' => $user ? $review->user_id === $user->id : false,
                'mediaType' => 'anime',
            ]);

        $reviews = $userReviews
            ->concat($externalReviews)
            ->sortByDesc(fn (array $item) => strtotime((string) ($item['date'] ?? '')))
            ->take(12)
            ->values();

        $myReview = $user
            ? UserReview::query()
                ->where('user_id', $user->id)
                ->where('media_type', 'anime')
                ->where('mal_id', $malId)
                ->first()
            : null;

        $news = $this->mergeNews(
            data_get($full, 'news', []),
            EntityRelation::query()
                ->where('from_type', 'anime')
                ->where('from_mal_id', $malId)
                ->where('relation_type', 'news')
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->pluck('meta')
                ->all(),
        );

        return Inertia::render('AnimeDetail', [
            'malId' => $malId,
            'entity' => array_merge($this->presentDetail($entity), [
                'userActions' => $user ? $actions->stateFor($user, 'anime', $entity->mal_id) : null,
                'imageUrl' => $entity->imageUrl(),
                'trailer' => data_get($full, 'trailer') ?? data_get($entity->payload, 'trailer'),
                'broadcast' => data_get($full, 'broadcast'),
                'themes' => $this->pluckNames(data_get($full, 'themes', [])),
                'explicitGenres' => $this->pluckNames(data_get($full, 'explicit_genres', [])),
                'demographics' => $this->pluckNames(data_get($full, 'demographics', [])),
                'producers' => $this->pluckNames(data_get($full, 'producers', [])),
                'licensors' => $this->pluckNames(data_get($full, 'licensors', [])),
                'themeSongs' => [
                    'openings' => data_get($full, 'theme.openings', []),
                    'endings' => data_get($full, 'theme.endings', []),
                ],
                'stats' => data_get($full, 'stats', []),
                'relations' => collect(data_get($full, 'relations', []))
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
                'staff' => collect(data_get($full, 'staff', []))
                    ->map(fn ($item) => [
                        'malId' => data_get($item, 'person.mal_id'),
                        'name' => data_get($item, 'person.name'),
                        'positions' => collect($item['positions'] ?? [])->filter()->values()->all(),
                        'imageUrl' => data_get($item, 'person.images.jpg.image_url')
                            ?? data_get($item, 'person.images.webp.image_url'),
                    ])
                    ->filter(fn ($item) => ! empty($item['name']))
                    ->values()
                    ->all(),
                'streaming' => collect(data_get($full, 'streaming', []))
                    ->map(fn ($item) => [
                        'name' => $item['name'] ?? null,
                        'url' => $item['url'] ?? null,
                    ])
                    ->filter(fn ($item) => ! empty($item['name']))
                    ->values()
                    ->all(),
                'externalLinks' => data_get($full, 'external', data_get($entity->payload, 'external', [])),
            ]),
            'recommendations' => $recommendations,
            'reviews' => $reviews,
            'myReview' => $myReview ? [
                'score' => (float) $myReview->score,
                'content' => $myReview->review,
                'isSpoiler' => (bool) $myReview->is_spoiler,
            ] : null,
            'news' => $news,
            'watchedEpisodes' => $this->watchedEpisodesFromStatus($userStatus),
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

    private function watchedEpisodesFromStatus(?UserMediaStatus $status): array
    {
        if (! $status) {
            return [];
        }

        $notes = [];
        if (is_string($status->notes) && $status->notes !== '') {
            $decoded = json_decode($status->notes, true);
            if (is_array($decoded)) {
                $notes = $decoded;
            }
        }

        $episodes = collect($notes['watched_episodes'] ?? [])
            ->map(fn ($episode) => (int) $episode)
            ->filter(fn ($episode) => $episode > 0)
            ->unique()
            ->sort()
            ->values()
            ->all();

        if ($episodes === [] && $status->progress > 0) {
            return range(1, (int) $status->progress);
        }

        return $episodes;
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

    private function present(CatalogEntity $entity, ?array $userActions = null): array
    {
        return [
            'malId' => $entity->mal_id,
            'title' => $entity->title,
            'titleJapanese' => data_get($entity->payload, 'title_japanese'),
            'score' => (float) ($entity->score ?? 0),
            'synopsis' => $entity->synopsis_short,
            'genres' => $this->pluckNames(data_get($entity->payload, 'genres', [])),
            'genreItems' => $this->pluckGenreItems(data_get($entity->payload, 'genres', [])),
            'status' => $entity->status,
            'type' => data_get($entity->payload, 'type', ''),
            'episodes' => data_get($entity->payload, 'episodes'),
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
}
