<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Inertia\Inertia;
use Inertia\Response;

class FavoritesController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();

        $favoriteRows = UserFavorite::query()
            ->where('user_id', $user->id)
            ->get();

        $animeIds = $favoriteRows
            ->where('entity_type', 'anime')
            ->pluck('mal_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
        $mangaIds = $favoriteRows
            ->where('entity_type', 'manga')
            ->pluck('mal_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $animeEntities = CatalogEntity::query()
            ->type('anime')
            ->when($animeIds->isNotEmpty(), fn ($query) => $query->whereIn('mal_id', $animeIds))
            ->get()
            ->keyBy('mal_id');
        $mangaEntities = CatalogEntity::query()
            ->type('manga')
            ->when($mangaIds->isNotEmpty(), fn ($query) => $query->whereIn('mal_id', $mangaIds))
            ->get()
            ->keyBy('mal_id');

        $statusByKey = collect();
        if ($animeIds->isNotEmpty() || $mangaIds->isNotEmpty()) {
            $statusByKey = UserMediaStatus::query()
                ->where('user_id', $user->id)
                ->where(function ($query) use ($animeIds, $mangaIds) {
                    if ($animeIds->isNotEmpty()) {
                        $query->orWhere(function ($subQuery) use ($animeIds) {
                            $subQuery->where('media_type', 'anime')->whereIn('mal_id', $animeIds);
                        });
                    }
                    if ($mangaIds->isNotEmpty()) {
                        $query->orWhere(function ($subQuery) use ($mangaIds) {
                            $subQuery->where('media_type', 'manga')->whereIn('mal_id', $mangaIds);
                        });
                    }
                })
                ->get()
                ->mapWithKeys(fn (UserMediaStatus $status) => ["{$status->media_type}:{$status->mal_id}" => $status->status]);
        }

        $favorites = $favoriteRows
            ->map(function (UserFavorite $favorite) use ($animeEntities, $mangaEntities, $statusByKey) {
                $entity = $favorite->entity_type === 'manga'
                    ? $mangaEntities->get($favorite->mal_id)
                    : $animeEntities->get($favorite->mal_id);

                if (! $entity) {
                    return null;
                }

                $status = $statusByKey->get("{$favorite->entity_type}:{$favorite->mal_id}");
                $buttonStatus = in_array($status, ['assistindo', 'completo', 'dropado'], true) ? $status : null;

                return [
                    'malId' => $entity->mal_id,
                    'mediaType' => $favorite->entity_type,
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
                    'userActions' => [
                        'favorite' => true,
                        'status' => $buttonStatus,
                    ],
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('Favorites', [
            'favorites' => $favorites,
        ]);
    }
}
