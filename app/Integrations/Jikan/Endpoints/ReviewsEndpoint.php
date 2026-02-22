<?php

namespace App\Integrations\Jikan\Endpoints;

class ReviewsEndpoint extends BaseEndpoint
{
    public function anime(int $page = 1): array
    {
        $response = $this->client->get('reviews/anime', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }
}
