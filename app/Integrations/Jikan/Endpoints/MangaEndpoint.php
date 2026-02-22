<?php

namespace App\Integrations\Jikan\Endpoints;

class MangaEndpoint extends BaseEndpoint
{
    public function getById(int $malId): array
    {
        $response = $this->client->get("manga/{$malId}");

        return $response->json('data') ?? [];
    }

    public function top(int $page = 1): array
    {
        $response = $this->client->get('top/manga', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }

    public function recommendations(int $malId): array
    {
        $response = $this->client->get("manga/{$malId}/recommendations");

        return $response->json('data') ?? [];
    }

    public function reviews(int $malId): array
    {
        $response = $this->client->get("manga/{$malId}/reviews");

        return $response->json('data') ?? [];
    }

    public function characters(int $malId): array
    {
        $response = $this->client->get("manga/{$malId}/characters");

        return $response->json('data') ?? [];
    }

    public function statistics(int $malId): array
    {
        $response = $this->client->get("manga/{$malId}/statistics");

        return $response->json('data') ?? [];
    }

    public function news(int $malId): array
    {
        $response = $this->client->get("manga/{$malId}/news");

        return $response->json('data') ?? [];
    }
}
