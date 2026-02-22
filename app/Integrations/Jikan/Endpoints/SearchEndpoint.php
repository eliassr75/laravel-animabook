<?php

namespace App\Integrations\Jikan\Endpoints;

class SearchEndpoint extends BaseEndpoint
{
    public function anime(string $query, int $page = 1): array
    {
        $response = $this->client->get('anime', [
            'q' => $query,
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }
}
