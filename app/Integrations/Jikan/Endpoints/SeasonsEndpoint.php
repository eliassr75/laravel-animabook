<?php

namespace App\Integrations\Jikan\Endpoints;

class SeasonsEndpoint extends BaseEndpoint
{
    public function current(): array
    {
        $response = $this->client->get('seasons/now');

        return $response->json('data') ?? [];
    }

    public function upcoming(): array
    {
        $response = $this->client->get('seasons/upcoming');

        return $response->json('data') ?? [];
    }
}
