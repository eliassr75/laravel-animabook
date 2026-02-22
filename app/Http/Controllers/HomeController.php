<?php

namespace App\Http\Controllers;

use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use App\Models\UserReview;
use App\Services\UserMediaActionsService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(UserMediaActionsService $actions): Response
    {
        $now = CarbonImmutable::now();
        $season = $this->seasonForMonth((int) $now->format('n'));
        $seasonAliases = $this->seasonAliases($season);

        $topAnime = CatalogEntity::query()
            ->type('anime')
            ->orderBy('rank')
            ->limit(6)
            ->get();

        $currentSeason = CatalogEntity::query()
            ->type('anime')
            ->where('year', (int) $now->format('Y'))
            ->whereIn(DB::raw('LOWER(season)'), $seasonAliases)
            ->limit(6)
            ->get();

        $recommendations = CatalogEntity::query()
            ->type('anime')
            ->orderByDesc('score')
            ->skip(4)
            ->limit(6)
            ->get();

        $user = request()->user();
        $allIds = $topAnime->pluck('mal_id')
            ->merge($currentSeason->pluck('mal_id'))
            ->merge($recommendations->pluck('mal_id'))
            ->unique()
            ->values()
            ->all();
        $actionStates = $user ? $actions->statesFor($user, 'anime', $allIds) : [];

        return Inertia::render('Index', [
            'topAnime' => $topAnime->map(fn (CatalogEntity $entity) => $this->present($entity, $actionStates[$entity->mal_id] ?? null)),
            'currentSeason' => $currentSeason->map(fn (CatalogEntity $entity) => $this->present($entity, $actionStates[$entity->mal_id] ?? null)),
            'recommendations' => $recommendations->map(fn (CatalogEntity $entity) => $this->present($entity, $actionStates[$entity->mal_id] ?? null)),
            'recentReviews' => $this->recentReviews(),
            'recentNews' => $this->recentNews(),
            'baseStats' => $this->baseStats(),
        ]);
    }

    private function baseStats(): array
    {
        return Cache::remember('home:base-stats:v2', now()->addMinutes(10), function (): array {
            $trackedTypes = ['anime', 'manga', 'character', 'person', 'producer', 'magazine', 'club', 'genre'];

            $typeCountsRaw = CatalogEntity::query()
                ->select('entity_type', DB::raw('COUNT(*) as total'))
                ->whereIn('entity_type', $trackedTypes)
                ->groupBy('entity_type')
                ->pluck('total', 'entity_type');

            $typeCounts = [];
            foreach ($trackedTypes as $type) {
                $typeCounts[$type] = (int) ($typeCountsRaw[$type] ?? 0);
            }

            $statusRows = CatalogEntity::query()
                ->select('entity_type', 'status', DB::raw('COUNT(*) as total'))
                ->whereIn('entity_type', ['anime', 'manga'])
                ->whereNotNull('status')
                ->groupBy('entity_type', 'status')
                ->get()
                ->groupBy('entity_type');

            $statusDistribution = [
                'anime' => collect($statusRows->get('anime', []))
                    ->sortByDesc('total')
                    ->take(5)
                    ->values()
                    ->map(fn ($row) => ['label' => (string) $row->status, 'value' => (int) $row->total])
                    ->all(),
                'manga' => collect($statusRows->get('manga', []))
                    ->sortByDesc('total')
                    ->take(5)
                    ->values()
                    ->map(fn ($row) => ['label' => (string) $row->status, 'value' => (int) $row->total])
                    ->all(),
            ];

            $genrePopularity = EntityRelation::query()
                ->select('to_mal_id', DB::raw('COUNT(*) as total'))
                ->whereIn('from_type', ['anime', 'manga'])
                ->where('to_type', 'genre')
                ->where('relation_type', 'genre')
                ->groupBy('to_mal_id')
                ->orderByDesc('total')
                ->limit(8)
                ->get();

            $genreTitles = CatalogEntity::query()
                ->type('genre')
                ->whereIn('mal_id', $genrePopularity->pluck('to_mal_id'))
                ->pluck('title', 'mal_id');

            $topGenres = $genrePopularity->map(fn ($row) => [
                'label' => (string) ($genreTitles[$row->to_mal_id] ?? "Gênero {$row->to_mal_id}"),
                'value' => (int) $row->total,
            ])->all();

            if ($topGenres === []) {
                $topGenres = $this->topGenresFromPayload();
            }

            $start = now()->startOfDay()->subDays(13);
            $dailyRows = CatalogEntity::query()
                ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
                ->where('created_at', '>=', $start)
                ->groupByRaw('DATE(created_at)')
                ->orderByRaw('DATE(created_at)')
                ->get();

            $dailyMap = $dailyRows->pluck('total', 'day');
            $ingestTrend = collect(range(0, 13))->map(function (int $offset) use ($start, $dailyMap) {
                $date = $start->copy()->addDays($offset);
                $key = $date->toDateString();

                return [
                    'label' => $date->format('d/m'),
                    'value' => (int) ($dailyMap[$key] ?? 0),
                ];
            })->all();

            $totalCatalog = (int) CatalogEntity::query()
                ->whereIn('entity_type', ['anime', 'manga'])
                ->count();

            $withImage = (int) CatalogEntity::query()
                ->whereIn('entity_type', ['anime', 'manga'])
                ->whereNotNull('images')
                ->count();

            $withSynopsis = (int) CatalogEntity::query()
                ->whereIn('entity_type', ['anime', 'manga'])
                ->whereNotNull('synopsis_short')
                ->where('synopsis_short', '!=', '')
                ->count();

            $withScore = (int) CatalogEntity::query()
                ->whereIn('entity_type', ['anime', 'manga'])
                ->whereNotNull('score')
                ->count();

            $percent = fn (int $value) => $totalCatalog > 0
                ? round(($value / $totalCatalog) * 100, 1)
                : 0.0;

            return [
                'counts' => $typeCounts,
                'statusDistribution' => $statusDistribution,
                'topGenres' => $topGenres,
                'ingestTrend' => $ingestTrend,
                'quality' => [
                    'withImage' => $percent($withImage),
                    'withSynopsis' => $percent($withSynopsis),
                    'withScore' => $percent($withScore),
                    'catalogTotal' => $totalCatalog,
                ],
            ];
        });
    }

    private function topGenresFromPayload(): array
    {
        $genreTotals = [];
        $genreLabels = [];

        CatalogEntity::query()
            ->select(['id', 'payload'])
            ->whereIn('entity_type', ['anime', 'manga'])
            ->whereNotNull('payload')
            ->orderBy('id')
            ->chunkById(500, function ($rows) use (&$genreTotals, &$genreLabels): void {
                foreach ($rows as $row) {
                    $genres = data_get($row->payload, 'genres', []);
                    if (! is_array($genres)) {
                        continue;
                    }

                    foreach ($genres as $genre) {
                        $name = is_array($genre) ? ($genre['name'] ?? null) : null;
                        if (! is_string($name) || trim($name) === '') {
                            continue;
                        }

                        $clean = trim($name);
                        $key = mb_strtolower($clean);
                        $genreTotals[$key] = ($genreTotals[$key] ?? 0) + 1;
                        $genreLabels[$key] = $genreLabels[$key] ?? $clean;
                    }
                }
            });

        arsort($genreTotals);

        return collect(array_slice($genreTotals, 0, 8, true))
            ->map(fn (int $total, string $key) => [
                'label' => $genreLabels[$key] ?? $key,
                'value' => $total,
            ])
            ->values()
            ->all();
    }

    private function recentReviews(): array
    {
        $externalReviews = EntityRelation::query()
            ->whereIn('from_type', ['anime', 'manga'])
            ->where('relation_type', 'review')
            ->whereNotNull('meta')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(function (EntityRelation $relation) {
                $meta = $relation->meta ?? [];
                $mediaType = $relation->from_type === 'manga' ? 'manga' : 'anime';
                $title = data_get($meta, "{$mediaType}.title")
                    ?? data_get($meta, 'anime.title')
                    ?? data_get($meta, 'manga.title')
                    ?? '—';
                $mediaMalId = (int) ($relation->from_mal_id
                    ?? data_get($meta, "{$mediaType}.mal_id")
                    ?? data_get($meta, 'anime.mal_id')
                    ?? data_get($meta, 'manga.mal_id')
                    ?? 0);

                return [
                    'id' => (int) ($relation->to_mal_id ?: $relation->id),
                    'user' => data_get($meta, 'user.username', 'Usuário'),
                    'animeTitle' => $title,
                    'animeMalId' => $mediaMalId,
                    'mediaType' => $mediaType,
                    'score' => (float) (data_get($meta, 'score', 0)),
                    'content' => (string) (data_get($meta, 'review', '')),
                    'date' => $this->formatReviewDate((string) data_get($meta, 'date', '')),
                    'sortAt' => strtotime((string) data_get($meta, 'date', '')) ?: $relation->created_at?->timestamp ?? 0,
                ];
            });

        $userReviewsRaw = UserReview::query()
            ->with('user:id,name')
            ->latest('updated_at')
            ->limit(8)
            ->get();

        $reviewIdsByType = $userReviewsRaw
            ->groupBy('media_type')
            ->map(fn ($rows) => $rows->pluck('mal_id')->map(fn ($id) => (int) $id)->unique()->values());

        $reviewTitles = collect();
        foreach (['anime', 'manga'] as $mediaType) {
            $ids = $reviewIdsByType->get($mediaType, collect());
            if ($ids->isEmpty()) {
                continue;
            }

            CatalogEntity::query()
                ->where('entity_type', $mediaType)
                ->whereIn('mal_id', $ids->all())
                ->pluck('title', 'mal_id')
                ->each(function ($title, $malId) use ($mediaType, $reviewTitles): void {
                    $reviewTitles->put("{$mediaType}:{$malId}", (string) $title);
                });
        }

        $userReviews = $userReviewsRaw
            ->map(function (UserReview $review) use ($reviewTitles) {
                $title = $reviewTitles->get("{$review->media_type}:{$review->mal_id}", '—');

                return [
                    'id' => 900_000_000_000 + $review->id,
                    'user' => $review->user?->name ?? 'Usuário',
                    'animeTitle' => $title,
                    'animeMalId' => (int) $review->mal_id,
                    'mediaType' => $review->media_type,
                    'score' => (float) $review->score,
                    'content' => (string) $review->review,
                    'date' => $this->formatReviewDate((string) $review->updated_at),
                    'sortAt' => $review->updated_at?->timestamp ?? 0,
                ];
            });

        return $userReviews
            ->concat($externalReviews)
            ->sortByDesc(fn (array $item) => (int) ($item['sortAt'] ?? 0))
            ->take(8)
            ->map(function (array $item) {
                unset($item['sortAt']);

                return $item;
            })
            ->values()
            ->all();
    }

    private function formatReviewDate(string $raw): string
    {
        if (trim($raw) === '') {
            return '—';
        }

        try {
            return CarbonImmutable::parse($raw)->locale('pt_BR')->translatedFormat('d/m/Y');
        } catch (\Throwable) {
            return $raw;
        }
    }

    private function recentNews(): array
    {
        $rows = EntityRelation::query()
            ->whereIn('from_type', ['anime', 'manga'])
            ->where('relation_type', 'news')
            ->whereNotNull('meta')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $newsIdsByType = $rows
            ->groupBy('from_type')
            ->map(fn ($items) => $items->pluck('from_mal_id')->map(fn ($id) => (int) $id)->unique()->values());

        $newsTitles = collect();
        foreach (['anime', 'manga'] as $mediaType) {
            $ids = $newsIdsByType->get($mediaType, collect());
            if ($ids->isEmpty()) {
                continue;
            }

            CatalogEntity::query()
                ->where('entity_type', $mediaType)
                ->whereIn('mal_id', $ids->all())
                ->pluck('title', 'mal_id')
                ->each(function ($title, $malId) use ($mediaType, $newsTitles): void {
                    $newsTitles->put("{$mediaType}:{$malId}", (string) $title);
                });
        }

        return $rows
            ->map(function (EntityRelation $relation) use ($newsTitles) {
                $meta = $relation->meta ?? [];
                $mediaType = $relation->from_type === 'manga' ? 'manga' : 'anime';
                $mediaTitle = $newsTitles->get("{$mediaType}:{$relation->from_mal_id}", '—');

                return [
                    'id' => (int) ($meta['mal_id'] ?? (abs(crc32((string) ($meta['url'] ?? $meta['title'] ?? ''))) ?: $relation->id)),
                    'title' => (string) ($meta['title'] ?? 'Sem título'),
                    'excerpt' => (string) ($meta['excerpt'] ?? $meta['intro'] ?? ''),
                    'url' => (string) ($meta['url'] ?? ''),
                    'author' => (string) ($meta['author_username'] ?? $meta['author'] ?? ''),
                    'date' => $this->formatReviewDate((string) ($meta['date'] ?? '')),
                    'mediaType' => $mediaType,
                    'mediaMalId' => (int) $relation->from_mal_id,
                    'mediaTitle' => (string) ($mediaTitle ?? '—'),
                    'sortAt' => strtotime((string) ($meta['date'] ?? '')) ?: $relation->created_at?->timestamp ?? 0,
                ];
            })
            ->filter(fn ($item) => $item['title'] !== 'Sem título')
            ->unique(fn ($item) => $item['url'] !== '' ? $item['url'] : "{$item['mediaType']}:{$item['mediaMalId']}:{$item['id']}")
            ->sortByDesc(fn ($item) => (int) ($item['sortAt'] ?? 0))
            ->take(8)
            ->map(function (array $item) {
                unset($item['sortAt']);

                return $item;
            })
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

    private function pluckNames(array $items): array
    {
        return collect($items)
            ->map(fn ($item) => is_array($item) ? ($item['name'] ?? null) : $item)
            ->filter()
            ->values()
            ->all();
    }

    private function seasonForMonth(int $month): string
    {
        return match (true) {
            $month >= 1 && $month <= 3 => 'winter',
            $month >= 4 && $month <= 6 => 'spring',
            $month >= 7 && $month <= 9 => 'summer',
            default => 'fall',
        };
    }

    private function seasonAliases(string $season): array
    {
        $aliases = match ($season) {
            'winter' => ['winter', 'inverno'],
            'spring' => ['spring', 'primavera'],
            'summer' => ['summer', 'verao', 'verão'],
            'fall' => ['fall', 'autumn', 'outono'],
            default => [$season],
        };

        return array_values(array_unique(array_map('mb_strtolower', $aliases)));
    }
}
