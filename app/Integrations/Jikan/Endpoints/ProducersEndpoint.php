<?php

namespace App\Integrations\Jikan\Endpoints;

class ProducersEndpoint extends BaseEndpoint
{
    public function getById(int $malId): array
    {
        $response = $this->client->get("producers/{$malId}");

        return $response->json('data') ?? [];
    }

    public function list(int $page = 1): array
    {
        $response = $this->client->get('producers', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }
}
