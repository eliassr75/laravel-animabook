<?php

namespace App\Integrations\Jikan\Endpoints;

class RandomEndpoint extends BaseEndpoint
{
    public function anime(): array
    {
        $response = $this->client->get('random/anime');

        return $response->json('data') ?? [];
    }

    public function manga(): array
    {
        $response = $this->client->get('random/manga');

        return $response->json('data') ?? [];
    }

    public function characters(): array
    {
        $response = $this->client->get('random/characters');

        return $response->json('data') ?? [];
    }

    public function people(): array
    {
        $response = $this->client->get('random/people');

        return $response->json('data') ?? [];
    }

    public function users(): array
    {
        $response = $this->client->get('random/users');

        return $response->json('data') ?? [];
    }
}
