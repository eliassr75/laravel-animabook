<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Inertia\Inertia;
use Inertia\Response;

class WatchlistController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();

        $statusRows = UserMediaStatus::query()
            ->where('user_id', $user->id)
            ->get();

        $animeIds = $statusRows
            ->where('media_type', 'anime')
            ->pluck('mal_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
        $mangaIds = $statusRows
            ->where('media_type', 'manga')
            ->pluck('mal_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $entitiesByKey = collect();
        if ($animeIds->isNotEmpty()) {
            CatalogEntity::query()
                ->type('anime')
                ->whereIn('mal_id', $animeIds)
                ->get()
                ->each(function (CatalogEntity $entity) use ($entitiesByKey): void {
                    $entitiesByKey->put("anime:{$entity->mal_id}", $entity);
                });
        }
        if ($mangaIds->isNotEmpty()) {
            CatalogEntity::query()
                ->type('manga')
                ->whereIn('mal_id', $mangaIds)
                ->get()
                ->each(function (CatalogEntity $entity) use ($entitiesByKey): void {
                    $entitiesByKey->put("manga:{$entity->mal_id}", $entity);
                });
        }

        $favoriteSet = UserFavorite::query()
            ->where('user_id', $user->id)
            ->whereIn('entity_type', ['anime', 'manga'])
            ->whereIn('mal_id', $statusRows->pluck('mal_id'))
            ->get()
            ->mapWithKeys(fn (UserFavorite $favorite) => ["{$favorite->entity_type}:{$favorite->mal_id}" => true]);

        $items = $statusRows
            ->map(function (UserMediaStatus $status) use ($entitiesByKey) {
                $entity = $entitiesByKey->get("{$status->media_type}:{$status->mal_id}");

                if (! $entity) {
                    return null;
                }

                $notes = [];
                if (is_string($status->notes) && $status->notes !== '') {
                    $decoded = json_decode($status->notes, true);
                    if (is_array($decoded)) {
                        $notes = $decoded;
                    }
                }
                $watchedEpisodes = collect($notes['watched_episodes'] ?? [])
                    ->map(fn ($episode) => (int) $episode)
                    ->filter(fn ($episode) => $episode > 0)
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();
                if ($watchedEpisodes === [] && $status->progress > 0) {
                    $watchedEpisodes = range(1, (int) $status->progress);
                }

                return [
                    'malId' => $entity->mal_id,
                    'title' => $entity->title,
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
                    'watchStatus' => $status->status,
                    'progress' => $status->progress,
                    'userScore' => $status->user_score,
                    'mediaType' => $status->media_type,
                    'watchedEpisodes' => $watchedEpisodes,
                    'streaming' => collect(data_get($entity->payload_full, 'streaming', []))
                        ->map(fn ($item) => [
                            'name' => is_array($item) ? ($item['name'] ?? null) : null,
                            'url' => is_array($item) ? ($item['url'] ?? null) : null,
                        ])
                        ->filter(fn ($item) => ! empty($item['name']))
                        ->values()
                        ->all(),
                ];
            })
            ->filter()
            ->map(function (array $item) use ($favoriteSet) {
                $status = in_array($item['watchStatus'], ['assistindo', 'completo', 'dropado'], true)
                    ? $item['watchStatus']
                    : null;
                $item['userActions'] = [
                    'favorite' => isset($favoriteSet["{$item['mediaType']}:{$item['malId']}"]),
                    'status' => $status,
                ];

                return $item;
            })
            ->values();

        return Inertia::render('Watchlist', [
            'items' => $items,
        ]);
    }
}
