<?php

namespace App\Integrations\Jikan\Endpoints;

class AnimeEndpoint extends BaseEndpoint
{
    public function getById(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}");

        return $response->json('data') ?? [];
    }

    public function getByIdFull(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/full");

        return $response->json('data') ?? [];
    }

    public function top(int $page = 1): array
    {
        $response = $this->client->get('top/anime', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }

    public function recommendations(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/recommendations");

        return $response->json('data') ?? [];
    }

    public function reviews(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/reviews");

        return $response->json('data') ?? [];
    }

    public function characters(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/characters");

        return $response->json('data') ?? [];
    }

    public function statistics(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/statistics");

        return $response->json('data') ?? [];
    }

    public function staff(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/staff");

        return $response->json('data') ?? [];
    }

    public function episodes(int $malId, int $page = 1): array
    {
        $response = $this->client->get("anime/{$malId}/episodes", [
            'page' => $page,
        ]);

        return [
            'data' => $response->json('data') ?? [],
            'pagination' => $response->json('pagination') ?? [],
        ];
    }

    public function episode(int $malId, int $episode): array
    {
        $response = $this->client->get("anime/{$malId}/episodes/{$episode}");

        return $response->json('data') ?? [];
    }

    public function news(int $malId): array
    {
        $response = $this->client->get("anime/{$malId}/news");

        return $response->json('data') ?? [];
    }

    public function episodeVideos(int $malId, int $page = 1): array
    {
        $response = $this->client->get("anime/{$malId}/videos/episodes", [
            'page' => $page,
        ]);

        return [
            'data' => $response->json('data') ?? [],
            'pagination' => $response->json('pagination') ?? [],
        ];
    }
}
