<?php

namespace App\Integrations\Jikan\Endpoints;

class MagazinesEndpoint extends BaseEndpoint
{
    public function list(int $page = 1): array
    {
        $response = $this->client->get('magazines', [
            'page' => $page,
        ]);

        return $response->json('data') ?? [];
    }
}
