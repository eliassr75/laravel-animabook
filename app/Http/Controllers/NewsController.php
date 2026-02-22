<?php

namespace App\Http\Controllers;

use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'type' => ['nullable', Rule::in(['all', 'anime', 'manga'])],
            'search' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', Rule::in(['recent', 'comments'])],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $type = (string) ($filters['type'] ?? 'all');
        $search = trim((string) ($filters['search'] ?? ''));
        $sort = (string) ($filters['sort'] ?? 'recent');
        $sortDir = (string) ($filters['sort_dir'] ?? 'desc');

        $query = EntityRelation::query()
            ->where('relation_type', 'news')
            ->whereIn('from_type', ['anime', 'manga']);

        if ($type !== 'all') {
            $query->where('from_type', $type);
        }

        if ($search !== '') {
            $query->where(function ($sub) use ($search) {
                $sub->where('meta->title', 'like', "%{$search}%")
                    ->orWhere('meta->excerpt', 'like', "%{$search}%")
                    ->orWhere('meta->intro', 'like', "%{$search}%");
            });
        }

        if ($sort === 'comments') {
            $query->orderBy('weight', $sortDir)->orderBy('created_at', 'desc');
        } else {
            $query->orderBy('created_at', $sortDir);
        }

        $items = $query->paginate(18)->withQueryString();

        $typeBuckets = $items->getCollection()
            ->groupBy('from_type')
            ->map(fn ($rows) => array_values(array_unique($rows->pluck('from_mal_id')->map(fn ($id) => (int) $id)->all())));

        $titles = [];
        foreach (['anime', 'manga'] as $mediaType) {
            $ids = $typeBuckets[$mediaType] ?? [];
            if ($ids === []) {
                continue;
            }

            CatalogEntity::query()
                ->where('entity_type', $mediaType)
                ->whereIn('mal_id', $ids)
                ->pluck('title', 'mal_id')
                ->each(function ($title, $malId) use (&$titles, $mediaType): void {
                    $titles["{$mediaType}:{$malId}"] = (string) $title;
                });
        }

        return Inertia::render('NewsList', [
            'items' => $items->getCollection()->map(function (EntityRelation $relation) use ($titles) {
                $meta = $relation->meta ?? [];
                $mediaType = $relation->from_type === 'manga' ? 'manga' : 'anime';
                $dateRaw = (string) ($meta['date'] ?? '');

                return [
                    'id' => (int) ($meta['mal_id'] ?? (abs(crc32((string) ($meta['url'] ?? $meta['title'] ?? ''))) ?: $relation->id)),
                    'title' => (string) ($meta['title'] ?? 'Sem título'),
                    'excerpt' => (string) ($meta['excerpt'] ?? $meta['intro'] ?? ''),
                    'url' => (string) ($meta['url'] ?? ''),
                    'author' => (string) ($meta['author_username'] ?? $meta['author'] ?? ''),
                    'date' => $this->formatDate($dateRaw),
                    'mediaType' => $mediaType,
                    'mediaMalId' => (int) $relation->from_mal_id,
                    'mediaTitle' => (string) ($titles["{$mediaType}:{$relation->from_mal_id}"] ?? '—'),
                ];
            })->values(),
            'meta' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
            ],
            'filters' => [
                'type' => $type,
                'search' => $search,
                'sort' => $sort,
                'sort_dir' => $sortDir,
            ],
        ]);
    }

    private function formatDate(string $raw): string
    {
        if ($raw === '') {
            return '—';
        }

        try {
            return CarbonImmutable::parse($raw)->locale('pt_BR')->translatedFormat('d/m/Y');
        } catch (\Throwable) {
            return $raw;
        }
    }
}
