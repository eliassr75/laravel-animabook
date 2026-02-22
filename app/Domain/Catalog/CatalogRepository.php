<?php

namespace App\Domain\Catalog;

use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogRepository
{
    public function list(string $entityType, array $filters = [], int $perPage = 24): LengthAwarePaginator
    {
        $query = CatalogEntity::query()->type($entityType);

        $this->applyFilters($query, $entityType, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $entityType, int $malId): ?CatalogEntity
    {
        return CatalogEntity::query()
            ->type($entityType)
            ->where('mal_id', $malId)
            ->first();
    }

    public function filterOptions(string $entityType): array
    {
        $base = CatalogEntity::query()->type($entityType);

        $years = (clone $base)
            ->whereNotNull('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->map(fn ($year) => (int) $year)
            ->values()
            ->all();

        $statuses = (clone $base)
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->values()
            ->all();

        $seasons = (clone $base)
            ->whereNotNull('season')
            ->distinct()
            ->pluck('season')
            ->values()
            ->all();

        $seasons = collect($seasons)
            ->unique(fn ($season) => mb_strtolower((string) $season))
            ->sort(function ($a, $b) {
                $order = $this->seasonSortOrder();
                $keyA = $order[$this->normalizeSeasonFilter((string) $a)] ?? 99;
                $keyB = $order[$this->normalizeSeasonFilter((string) $b)] ?? 99;
                if ($keyA === $keyB) {
                    return strcmp((string) $a, (string) $b);
                }
                return $keyA <=> $keyB;
            })
            ->values()
            ->all();

        $types = (clone $base)
            ->get(['payload'])
            ->map(fn (CatalogEntity $entity) => data_get($entity->payload, 'type'))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $genres = [];
        if (in_array($entityType, ['anime', 'manga'], true)) {
            $genreIds = EntityRelation::query()
                ->where('from_type', $entityType)
                ->where('to_type', 'genre')
                ->where('relation_type', 'genre')
                ->distinct()
                ->pluck('to_mal_id');

            if ($genreIds->isNotEmpty()) {
                $genres = CatalogEntity::query()
                    ->type('genre')
                    ->whereIn('mal_id', $genreIds)
                    ->orderBy('title')
                    ->get(['mal_id', 'title'])
                    ->map(fn (CatalogEntity $entity) => [
                        'id' => $entity->mal_id,
                        'name' => $entity->title,
                    ])
                    ->values()
                    ->all();
            }
        }

        return [
            'years' => $years,
            'statuses' => $statuses,
            'seasons' => $seasons,
            'types' => $types,
            'genres' => $genres,
            'sorts' => [
                'score',
                'rank',
                'popularity',
                'members',
                'favorites',
                'created_at',
                'updated_at',
                'title',
                'year',
            ],
        ];
    }

    private function applyFilters(Builder $query, string $entityType, array $filters): void
    {
        if (! empty($filters['search'])) {
            $normalized = $this->normalizeTitle($filters['search']);
            $query->where(function (Builder $q) use ($normalized, $filters): void {
                $q->where('title_normalized', 'like', $normalized.'%');

                if (! empty($filters['search'])) {
                    $q->orWhere('title', 'like', $filters['search'].'%');
                }
            });
        }

        if (! empty($filters['year'])) {
            $query->where('year', $filters['year']);
        }

        if (! empty($filters['season'])) {
            $aliases = $this->seasonAliases((string) $filters['season']);
            $query->whereIn(DB::raw('LOWER(season)'), $aliases);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('payload->type', $filters['type']);
        }

        if (isset($filters['min_score']) && $filters['min_score'] !== '') {
            $query->where('score', '>=', (float) $filters['min_score']);
        }

        if (isset($filters['max_score']) && $filters['max_score'] !== '') {
            $query->where('score', '<=', (float) $filters['max_score']);
        }

        if (isset($filters['max_rank']) && $filters['max_rank'] !== '') {
            $query->where('rank', '<=', (int) $filters['max_rank']);
        }

        if (isset($filters['min_members']) && $filters['min_members'] !== '') {
            $query->where('members', '>=', (int) $filters['min_members']);
        }

        if (isset($filters['year_from']) && $filters['year_from'] !== '') {
            $query->where('year', '>=', (int) $filters['year_from']);
        }

        if (isset($filters['year_to']) && $filters['year_to'] !== '') {
            $query->where('year', '<=', (int) $filters['year_to']);
        }

        if (! empty($filters['has_image'])) {
            $query->whereNotNull('images');
        }

        if (! empty($filters['has_season'])) {
            $query->whereNotNull('season');
        }

        if (! empty($filters['genre']) && in_array($entityType, ['anime', 'manga'], true)) {
            $genreValue = $filters['genre'];
            $genreId = is_numeric($genreValue)
                ? (int) $genreValue
                : (int) CatalogEntity::query()
                    ->type('genre')
                    ->whereRaw('LOWER(title) = ?', [mb_strtolower((string) $genreValue)])
                    ->value('mal_id');

            if (! $genreId) {
                return;
            }

            $query->whereIn('mal_id', function ($sub) use ($entityType, $genreId) {
                $sub->select('from_mal_id')
                    ->from('entity_relations')
                    ->where('from_type', $entityType)
                    ->where('to_type', 'genre')
                    ->where('relation_type', 'genre')
                    ->where('to_mal_id', $genreId);
            });
        }

        $sort = $filters['sort'] ?? null;
        $requestedDirection = mb_strtolower((string) ($filters['sort_dir'] ?? ''));
        $direction = in_array($requestedDirection, ['asc', 'desc'], true) ? $requestedDirection : null;
        $defaultDirection = match ($sort) {
            'title', 'rank', 'popularity' => 'asc',
            default => 'desc',
        };
        $direction = $direction ?? $defaultDirection;

        $query->when($sort === 'score', fn (Builder $q) => $q->orderBy('score', $direction));
        $query->when($sort === 'rank', fn (Builder $q) => $q->orderBy('rank', $direction));
        $query->when($sort === 'popularity', fn (Builder $q) => $q->orderBy('popularity', $direction));
        $query->when($sort === 'members', fn (Builder $q) => $q->orderBy('members', $direction));
        $query->when($sort === 'favorites', fn (Builder $q) => $q->orderBy('favorites', $direction));
        $query->when($sort === 'created_at', fn (Builder $q) => $q->orderBy('created_at', $direction));
        $query->when($sort === 'updated_at', fn (Builder $q) => $q->orderBy('updated_at', $direction));
        $query->when($sort === 'title', fn (Builder $q) => $q->orderBy('title', $direction));
        $query->when($sort === 'year', fn (Builder $q) => $q->orderBy('year', $direction));
        $query->when(! $sort, fn (Builder $q) => $q->orderByDesc('score'));
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }

    private function normalizeSeasonFilter(string $season): string
    {
        $value = Str::of($season)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
        $value = preg_replace('/[^a-z]/', '', $value) ?? $value;

        return match ($value) {
            'inverno' => 'winter',
            'primavera' => 'spring',
            'verao' => 'summer',
            'outono' => 'fall',
            'autumn' => 'fall',
            default => $value,
        };
    }

    private function seasonAliases(string $season): array
    {
        $normalized = $this->normalizeSeasonFilter($season);
        $aliases = [$normalized];

        if (in_array($normalized, ['winter', 'spring', 'summer', 'fall'], true)) {
            $aliases = array_merge($aliases, match ($normalized) {
                'winter' => ['inverno'],
                'spring' => ['primavera'],
                'summer' => ['verao', 'verão'],
                'fall' => ['outono', 'autumn'],
                default => [],
            });
        }

        return array_values(array_unique(array_map(
            fn ($value) => mb_strtolower((string) $value),
            $aliases,
        )));
    }

    private function seasonSortOrder(): array
    {
        return [
            'winter' => 0,
            'spring' => 1,
            'summer' => 2,
            'fall' => 3,
        ];
    }
}
