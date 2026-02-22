<?php

namespace App\Http\Controllers;

use App\Models\CatalogEntity;
use App\Models\EntityRelation;
use App\Services\UserMediaActionsService;
use Inertia\Inertia;
use Inertia\Response;

class CharacterController extends Controller
{
    public function show(int $malId, UserMediaActionsService $actions): Response
    {
        $entity = CatalogEntity::query()
            ->type('character')
            ->where('mal_id', $malId)
            ->first();

        if (! $entity) {
            abort(404);
        }

        $relations = EntityRelation::query()
            ->where('to_type', 'character')
            ->where('to_mal_id', $malId)
            ->whereIn('from_type', ['anime', 'manga'])
            ->limit(12)
            ->get();

        $relatedEntities = CatalogEntity::query()
            ->whereIn('mal_id', $relations->pluck('from_mal_id'))
            ->get()
            ->keyBy('mal_id');

        $related = $relations->map(function (EntityRelation $relation) use ($relatedEntities) {
            $entity = $relatedEntities->get($relation->from_mal_id);
            $type = $relation->from_type;
            $meta = $relation->meta ?? [];
            $entityTitle = $entity?->title;
            if (! $entityTitle || in_array(strtolower($entityTitle), ['unknown', 'unkown'], true)) {
                $entityTitle = data_get($entity?->payload, 'title')
                    ?? data_get($entity?->payload, 'name')
                    ?? null;
            }

            return [
                'malId' => $relation->from_mal_id,
                'title' => $entityTitle ?? ($meta['anime']['title'] ?? $meta['manga']['title'] ?? '—'),
                'subtitle' => $type,
                'role' => $meta['role'] ?? null,
                'score' => $entity?->score,
                'status' => $entity?->status,
                'year' => $entity?->year,
                'imageUrl' => $entity?->imageUrl()
                    ?? data_get($meta, 'anime.images.jpg.image_url')
                    ?? data_get($meta, 'anime.images.webp.image_url')
                    ?? data_get($meta, 'manga.images.jpg.image_url')
                    ?? data_get($meta, 'manga.images.webp.image_url'),
                'href' => $type === 'manga' ? "/manga/{$relation->from_mal_id}" : "/anime/{$relation->from_mal_id}",
                'mediaType' => in_array($type, ['anime', 'manga'], true) ? $type : null,
            ];
        })->values();

        $user = request()->user();
        $animeStates = $user
            ? $actions->statesFor($user, 'anime', $related->where('mediaType', 'anime')->pluck('malId')->all())
            : [];
        $mangaStates = $user
            ? $actions->statesFor($user, 'manga', $related->where('mediaType', 'manga')->pluck('malId')->all())
            : [];

        $related = $related->map(function (array $item) use ($animeStates, $mangaStates) {
            if (($item['mediaType'] ?? null) === 'anime') {
                $item['userActions'] = $animeStates[$item['malId']] ?? null;
            } elseif (($item['mediaType'] ?? null) === 'manga') {
                $item['userActions'] = $mangaStates[$item['malId']] ?? null;
            } else {
                $item['userActions'] = null;
            }

            return $item;
        })->values();

        return Inertia::render('CharacterDetail', [
            'entity' => [
                'malId' => $entity->mal_id,
                'title' => $this->entityTitle($entity),
                'subtitle' => data_get($entity->payload, 'name_kanji'),
                'imageUrl' => $entity->imageUrl(),
                'synopsis' => data_get($entity->payload, 'about'),
            ],
            'related' => $related,
            'relatedAnime' => $related->where('subtitle', 'anime')->values(),
            'relatedManga' => $related->where('subtitle', 'manga')->values(),
        ]);
    }

    private function entityTitle(CatalogEntity $entity): string
    {
        $title = $entity->title;
        if ($title && ! in_array(strtolower($title), ['unknown', 'unkown'], true)) {
            return $title;
        }

        return data_get($entity->payload, 'name')
            ?? data_get($entity->payload, 'title')
            ?? data_get($entity->payload, 'title_english')
            ?? data_get($entity->payload, 'title_japanese')
            ?? '—';
    }
}
