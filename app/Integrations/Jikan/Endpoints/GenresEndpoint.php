<?php

namespace App\Integrations\Jikan\Endpoints;

class GenresEndpoint extends BaseEndpoint
{
    public function list(string $type = 'anime'): array
    {
        $response = $this->client->get("genres/{$type}");

        return $response->json('data') ?? [];
    }
}
