<?php

namespace App\Integrations\Jikan\Endpoints;

class PeopleEndpoint extends BaseEndpoint
{
    public function getById(int $malId): array
    {
        $response = $this->client->get("people/{$malId}");

        return $response->json('data') ?? [];
    }
}
