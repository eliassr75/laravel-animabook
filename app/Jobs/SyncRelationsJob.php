<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\AnimeEndpoint;
use App\Integrations\Jikan\Endpoints\MangaEndpoint;
use App\Models\EntityRelation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncRelationsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $entityType,
        public readonly int $malId,
    ) {
    }

    public function handle(AnimeEndpoint $animeEndpoint, MangaEndpoint $mangaEndpoint): void
    {
        if (! in_array($this->entityType, ['anime', 'manga'], true)) {
            return;
        }

        $payload = \App\Models\CatalogEntity::query()
            ->where('entity_type', $this->entityType)
            ->where('mal_id', $this->malId)
            ->value('payload');

        if ($payload && isset($payload['relations'])) {
            foreach ($payload['relations'] as $relationGroup) {
                $relation = $relationGroup['relation'] ?? null;
                $entries = $relationGroup['entry'] ?? [];
                if (! $relation || ! is_array($entries)) {
                    continue;
                }

                foreach ($entries as $entry) {
                    if (! isset($entry['mal_id'], $entry['type'])) {
                        continue;
                    }

                    EntityRelation::updateOrCreate([
                        'from_type' => $this->entityType,
                        'from_mal_id' => $this->malId,
                        'to_type' => strtolower($entry['type']),
                        'to_mal_id' => (int) $entry['mal_id'],
                        'relation_type' => strtolower($relation),
                    ], [
                        'weight' => 0,
                        'meta' => $entry,
                    ]);
                }
            }
        }

        $recommendations = $this->entityType === 'anime'
            ? $animeEndpoint->recommendations($this->malId)
            : $mangaEndpoint->recommendations($this->malId);

        foreach ($recommendations as $recommendation) {
            $entry = $recommendation['entry'] ?? null;
            if (! $entry || ! isset($entry['mal_id'])) {
                continue;
            }

            EntityRelation::updateOrCreate([
                'from_type' => $this->entityType,
                'from_mal_id' => $this->malId,
                'to_type' => $this->entityType,
                'to_mal_id' => (int) $entry['mal_id'],
                'relation_type' => 'recommendation',
            ], [
                'weight' => (int) ($recommendation['votes'] ?? 0),
                'meta' => $recommendation,
            ]);

            $this->enqueueRelated($this->entityType, (int) $entry['mal_id']);
        }

        $reviews = $this->entityType === 'anime'
            ? $animeEndpoint->reviews($this->malId)
            : $mangaEndpoint->reviews($this->malId);

        foreach ($reviews as $review) {
            if (! isset($review['mal_id'])) {
                continue;
            }

            EntityRelation::updateOrCreate([
                'from_type' => $this->entityType,
                'from_mal_id' => $this->malId,
                'to_type' => 'review',
                'to_mal_id' => (int) $review['mal_id'],
                'relation_type' => 'review',
            ], [
                'weight' => (int) ($review['score'] ?? 0),
                'meta' => $review,
            ]);
        }

        $newsItems = $this->entityType === 'anime'
            ? $animeEndpoint->news($this->malId)
            : $mangaEndpoint->news($this->malId);

        foreach ($newsItems as $news) {
            $newsId = $this->newsId($news);
            if ($newsId <= 0) {
                continue;
            }

            EntityRelation::updateOrCreate([
                'from_type' => $this->entityType,
                'from_mal_id' => $this->malId,
                'to_type' => 'news',
                'to_mal_id' => $newsId,
                'relation_type' => 'news',
            ], [
                'weight' => (int) ($news['comments'] ?? 0),
                'meta' => $news,
            ]);
        }

        $characters = $this->entityType === 'anime'
            ? $animeEndpoint->characters($this->malId)
            : $mangaEndpoint->characters($this->malId);

        foreach ($characters as $character) {
            $entry = $character['character'] ?? null;
            if (! $entry || ! isset($entry['mal_id'])) {
                continue;
            }

            EntityRelation::updateOrCreate([
                'from_type' => $this->entityType,
                'from_mal_id' => $this->malId,
                'to_type' => 'character',
                'to_mal_id' => (int) $entry['mal_id'],
                'relation_type' => 'character',
            ], [
                'weight' => 0,
                'meta' => $character,
            ]);

            $this->enqueueRelated('character', (int) $entry['mal_id']);

            foreach ($character['voice_actors'] ?? [] as $voice) {
                $person = $voice['person'] ?? null;
                if (! $person || ! isset($person['mal_id'])) {
                    continue;
                }

                EntityRelation::updateOrCreate([
                    'from_type' => $this->entityType,
                    'from_mal_id' => $this->malId,
                    'to_type' => 'person',
                    'to_mal_id' => (int) $person['mal_id'],
                    'relation_type' => 'voice',
                ], [
                    'weight' => 0,
                    'meta' => $voice,
                ]);

                $this->enqueueRelated('person', (int) $person['mal_id']);
            }
        }

        if ($this->entityType === 'anime') {
            foreach ($animeEndpoint->staff($this->malId) as $staff) {
                $person = $staff['person'] ?? null;
                if (! $person || ! isset($person['mal_id'])) {
                    continue;
                }

                EntityRelation::updateOrCreate([
                    'from_type' => $this->entityType,
                    'from_mal_id' => $this->malId,
                    'to_type' => 'person',
                    'to_mal_id' => (int) $person['mal_id'],
                    'relation_type' => 'staff',
                ], [
                    'weight' => 0,
                    'meta' => $staff,
                ]);

                $this->enqueueRelated('person', (int) $person['mal_id']);
            }
        }
    }

    private function enqueueRelated(string $entityType, int $malId): void
    {
        $allowed = ['anime', 'manga', 'character', 'person', 'producer', 'magazine', 'club', 'watch', 'genre'];
        if (! in_array($entityType, $allowed, true)) {
            return;
        }

        SyncEntityJob::dispatch($entityType, $malId)->onQueue('low');
    }

    private function newsId(array $news): int
    {
        $rawId = $news['mal_id'] ?? null;
        if (is_numeric($rawId) && (int) $rawId > 0) {
            return (int) $rawId;
        }

        $hashSource = (string) ($news['url'] ?? $news['title'] ?? '');
        if ($hashSource === '') {
            return 0;
        }

        return abs(crc32($hashSource));
    }
}
