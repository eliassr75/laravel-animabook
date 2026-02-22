<?php

namespace App\Integrations\Jikan\Endpoints;

class RecommendationsEndpoint extends BaseEndpoint
{
    public function anime(int $page = 1): array
    {
        $response = $this->client->get('recommendations/anime', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }
}
