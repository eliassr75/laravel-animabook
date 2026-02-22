<?php

namespace App\Integrations\Jikan\Endpoints;

class CharactersEndpoint extends BaseEndpoint
{
    public function getById(int $malId): array
    {
        $response = $this->client->get("characters/{$malId}");

        return $response->json('data') ?? [];
    }
}
