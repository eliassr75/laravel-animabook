<?php

namespace App\Integrations\Jikan\Endpoints;

class ClubsEndpoint extends BaseEndpoint
{
    public function list(int $page = 1): array
    {
        $response = $this->client->get('clubs', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }

    public function getById(int $malId): array
    {
        $response = $this->client->get("clubs/{$malId}");

        return $response->json('data') ?? [];
    }
}
