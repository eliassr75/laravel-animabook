<?php

namespace App\Integrations\Jikan\Endpoints;

class WatchEndpoint extends BaseEndpoint
{
    public function recentEpisodes(): array
    {
        $response = $this->client->get('watch/episodes');

        return $response->json('data') ?? [];
    }

    public function popularEpisodes(): array
    {
        $response = $this->client->get('watch/episodes/popular');

        return $response->json('data') ?? [];
    }
}
