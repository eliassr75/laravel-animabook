<?php

namespace App\Integrations\Jikan\Mappers;

use Illuminate\Support\Str;

class CatalogEntityMapper
{
    public function map(string $entityType, array $payload): array
    {
        $title = $payload['title']
            ?? $payload['name']
            ?? $payload['title_english']
            ?? $payload['title_japanese']
            ?? '—';

        return [
            'title' => $title,
            'title_normalized' => $this->normalizeTitle($title),
            'synopsis_short' => $payload['synopsis'] ?? null,
            'year' => $payload['year'] ?? data_get($payload, 'aired.prop.from.year'),
            'season' => $payload['season'] ?? null,
            'status' => $payload['status'] ?? null,
            'rating' => $payload['rating'] ?? null,
            'score' => $payload['score'] ?? null,
            'rank' => $payload['rank'] ?? null,
            'popularity' => $payload['popularity'] ?? null,
            'members' => $payload['members'] ?? null,
            'favorites' => $payload['favorites'] ?? null,
            'images' => $payload['images'] ?? null,
            'trailer' => $payload['trailer'] ?? null,
            'external_links' => $payload['external'] ?? null,
        ];
    }

    private function normalizeTitle(string $value): string
    {
        $value = Str::of($value)->lower()->trim()->value();
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;

        return preg_replace('/[^a-z0-9\\s]/', '', $value) ?? $value;
    }
}
