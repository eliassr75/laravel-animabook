<?php

namespace App\Integrations\Jikan\Endpoints;

class UsersEndpoint extends BaseEndpoint
{
    public function search(array $query = []): array
    {
        $response = $this->client->get('users', $query);

        return $response->json('data') ?? [];
    }

    public function getById(int $id): array
    {
        $response = $this->client->get("users/userbyid/{$id}");

        return $response->json('data') ?? [];
    }

    public function profile(string $username): array
    {
        $response = $this->client->get("users/{$username}");

        return $response->json('data') ?? [];
    }

    public function full(string $username): array
    {
        $response = $this->client->get("users/{$username}/full");

        return $response->json('data') ?? [];
    }

    public function statistics(string $username): array
    {
        $response = $this->client->get("users/{$username}/statistics");

        return $response->json('data') ?? [];
    }

    public function favorites(string $username): array
    {
        $response = $this->client->get("users/{$username}/favorites");

        return $response->json('data') ?? [];
    }

    public function updates(string $username): array
    {
        $response = $this->client->get("users/{$username}/userupdates");

        return $response->json('data') ?? [];
    }

    public function about(string $username): array
    {
        $response = $this->client->get("users/{$username}/about");

        return $response->json('data') ?? [];
    }

    public function history(string $username, array $query = []): array
    {
        $response = $this->client->get("users/{$username}/history", $query);

        return $response->json('data') ?? [];
    }

    public function friends(string $username, array $query = []): array
    {
        $response = $this->client->get("users/{$username}/friends", $query);

        return $response->json('data') ?? [];
    }

    public function reviews(string $username, array $query = []): array
    {
        $response = $this->client->get("users/{$username}/reviews", $query);

        return $response->json('data') ?? [];
    }

    public function recommendations(string $username, array $query = []): array
    {
        $response = $this->client->get("users/{$username}/recommendations", $query);

        return $response->json('data') ?? [];
    }

    public function clubs(string $username, array $query = []): array
    {
        $response = $this->client->get("users/{$username}/clubs", $query);

        return $response->json('data') ?? [];
    }

    public function external(string $username): array
    {
        $response = $this->client->get("users/{$username}/external");

        return $response->json('data') ?? [];
    }
}
