<?php

namespace App\Integrations\Jikan\Endpoints;

class TopEndpoint extends BaseEndpoint
{
    public function anime(int $page = 1, array $query = []): array
    {
        $response = $this->client->get('top/anime', array_merge($query, [
            'page' => $page,
        ]));

        return $response->json('data') ?? [];
    }

    public function manga(int $page = 1, array $query = []): array
    {
        $response = $this->client->get('top/manga', array_merge($query, [
            'page' => $page,
        ]));

        return $response->json('data') ?? [];
    }

    public function people(int $page = 1, array $query = []): array
    {
        $response = $this->client->get('top/people', array_merge($query, [
            'page' => $page,
        ]));

        return $response->json('data') ?? [];
    }

    public function characters(int $page = 1, array $query = []): array
    {
        $response = $this->client->get('top/characters', array_merge($query, [
            'page' => $page,
        ]));

        return $response->json('data') ?? [];
    }

    public function reviews(int $page = 1, array $query = []): array
    {
        $response = $this->client->get('top/reviews', array_merge($query, [
            'page' => $page,
        ]));

        return $response->json('data') ?? [];
    }
}
