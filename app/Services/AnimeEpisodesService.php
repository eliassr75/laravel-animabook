<?php

namespace App\Services;

use App\Integrations\Jikan\Endpoints\AnimeEndpoint;
use App\Models\EntityRelation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class AnimeEpisodesService
{
    public function forAnime(int $malId, bool $forceRefresh = false): array
    {
        if ($forceRefresh) {
            $stored = $this->storedEpisodes($malId);
            if ($stored !== []) {
                return $stored;
            }

            return $this->fetchAndStore($malId);
        }

        $cacheKey = "anime:episodes:v1:{$malId}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($malId): array {
            $stored = $this->storedEpisodes($malId);
            if ($stored !== []) {
                return $stored;
            }

            if (app()->environment('testing')) {
                return [];
            }

            return $this->fetchAndStore($malId);
        });
    }

    private function storedEpisodes(int $malId): array
    {
        $episodes = EntityRelation::query()
            ->where('from_type', 'anime')
            ->where('from_mal_id', $malId)
            ->where('relation_type', 'episode')
            ->where('to_type', 'episode')
            ->orderBy('to_mal_id')
            ->get()
            ->map(fn (EntityRelation $relation) => $this->normalizeEpisode($relation->meta ?? [], (int) $relation->to_mal_id))
            ->filter(fn (array $item) => ($item['number'] ?? 0) > 0)
            ->values();

        if ($episodes->isEmpty()) {
            return [];
        }

        $videosByEpisode = $this->videoMap($malId);

        return $episodes
            ->map(function (array $episode) use ($videosByEpisode) {
                $video = $videosByEpisode->get((int) $episode['number'], []);

                return array_merge($episode, [
                    'videoUrl' => $video['videoUrl'] ?? null,
                    'videoTitle' => $video['videoTitle'] ?? null,
                    'videoImageUrl' => $video['videoImageUrl'] ?? null,
                ]);
            })
            ->values()
            ->all();
    }

    private function fetchAndStore(int $malId): array
    {
        /** @var AnimeEndpoint $endpoint */
        $endpoint = app(AnimeEndpoint::class);
        $episodes = [];

        try {
            $page = 1;
            do {
                $payload = $endpoint->episodes($malId, $page);
                $rows = $payload['data'] ?? [];
                $hasNext = (bool) data_get($payload, 'pagination.has_next_page', false);

                foreach ($rows as $item) {
                    if (! is_array($item)) {
                        continue;
                    }

                    $number = (int) ($item['mal_id'] ?? 0);
                    if ($number <= 0) {
                        continue;
                    }

                    EntityRelation::query()->updateOrCreate([
                        'from_type' => 'anime',
                        'from_mal_id' => $malId,
                        'to_type' => 'episode',
                        'to_mal_id' => $number,
                        'relation_type' => 'episode',
                    ], [
                        'weight' => isset($item['score']) ? (int) round(((float) $item['score']) * 10) : 0,
                        'meta' => $item,
                    ]);

                    $episodes[] = $this->normalizeEpisode($item, $number);
                }

                $page++;
            } while ($hasNext && $page <= 50);

            $videoPage = 1;
            do {
                $videoPayload = $endpoint->episodeVideos($malId, $videoPage);
                $videoRows = $videoPayload['data'] ?? [];
                $videoHasNext = (bool) data_get($videoPayload, 'pagination.has_next_page', false);

                foreach ($videoRows as $video) {
                    if (! is_array($video)) {
                        continue;
                    }

                    $number = $this->parseEpisodeNumber($video['episode'] ?? null);
                    if ($number <= 0) {
                        continue;
                    }

                    EntityRelation::query()->updateOrCreate([
                        'from_type' => 'anime',
                        'from_mal_id' => $malId,
                        'to_type' => 'episode',
                        'to_mal_id' => $number,
                        'relation_type' => 'episode_video',
                    ], [
                        'weight' => 0,
                        'meta' => $video,
                    ]);
                }

                $videoPage++;
            } while ($videoHasNext && $videoPage <= 20);
        } catch (Throwable $e) {
            Log::warning('Failed to sync anime episodes on demand', [
                'mal_id' => $malId,
                'error' => $e->getMessage(),
            ]);
            return [];
        }

        $videosByEpisode = $this->videoMap($malId);

        return collect($episodes)
            ->sortBy('number')
            ->unique('number')
            ->map(function (array $episode) use ($videosByEpisode) {
                $video = $videosByEpisode->get((int) $episode['number'], []);

                return array_merge($episode, [
                    'videoUrl' => $video['videoUrl'] ?? null,
                    'videoTitle' => $video['videoTitle'] ?? null,
                    'videoImageUrl' => $video['videoImageUrl'] ?? null,
                ]);
            })
            ->values()
            ->all();
    }

    private function normalizeEpisode(array $item, int $fallbackNumber): array
    {
        $airedRaw = $item['aired'] ?? null;
        $aired = null;
        if (is_string($airedRaw)) {
            $aired = $airedRaw;
        } elseif (is_array($airedRaw)) {
            $aired = (string) ($airedRaw['string'] ?? $airedRaw['from'] ?? '');
            if ($aired === '') {
                $aired = null;
            }
        }

        return [
            'number' => (int) ($item['mal_id'] ?? $fallbackNumber),
            'title' => $item['title'] ?? null,
            'titleJapanese' => $item['title_japanese'] ?? null,
            'filler' => (bool) ($item['filler'] ?? false),
            'recap' => (bool) ($item['recap'] ?? false),
            'aired' => $aired,
            'score' => isset($item['score']) ? (float) $item['score'] : null,
            'forumUrl' => $item['forum_url'] ?? null,
        ];
    }

    private function videoMap(int $malId): \Illuminate\Support\Collection
    {
        return EntityRelation::query()
            ->where('from_type', 'anime')
            ->where('from_mal_id', $malId)
            ->where('relation_type', 'episode_video')
            ->where('to_type', 'episode')
            ->orderByDesc('updated_at')
            ->get()
            ->reduce(function (\Illuminate\Support\Collection $carry, EntityRelation $relation) {
                $episodeNumber = (int) $relation->to_mal_id;
                if ($episodeNumber <= 0 || $carry->has($episodeNumber)) {
                    return $carry;
                }

                $meta = $relation->meta ?? [];
                $videoUrl = data_get($meta, 'url');
                $videoImageUrl = data_get($meta, 'images.jpg.image_url')
                    ?? data_get($meta, 'images.webp.image_url')
                    ?? data_get($meta, 'images.image_url');

                if ((! is_string($videoUrl) || trim($videoUrl) === '')
                    && (! is_string($videoImageUrl) || trim($videoImageUrl) === '')) {
                    return $carry;
                }

                $carry->put($episodeNumber, [
                    'videoUrl' => is_string($videoUrl) ? $videoUrl : null,
                    'videoTitle' => data_get($meta, 'title'),
                    'videoImageUrl' => is_string($videoImageUrl) ? $videoImageUrl : null,
                ]);

                return $carry;
            }, collect());
    }

    private function parseEpisodeNumber(mixed $value): int
    {
        if (is_numeric($value)) {
            return max(0, (int) $value);
        }

        if (is_string($value)) {
            if (preg_match('/\d+/', $value, $matches) === 1) {
                return max(0, (int) ($matches[0] ?? 0));
            }
        }

        return 0;
    }
}
