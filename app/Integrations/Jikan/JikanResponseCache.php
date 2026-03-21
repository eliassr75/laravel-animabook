<?php

namespace App\Integrations\Jikan;

use App\Models\JikanCache;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Str;

class JikanResponseCache
{
    public function get(string $path, array $query = []): ?Response
    {
        $endpoint = $this->normalizeEndpoint($path);
        if (! $this->enabledFor($endpoint)) {
            return null;
        }

        $entry = JikanCache::query()
            ->where('key', $this->cacheKey($endpoint, $query))
            ->first();

        if (! $entry) {
            return null;
        }

        if ($entry->expires_at?->isPast()) {
            $entry->delete();

            return null;
        }

        $body = $entry->payload_json;
        if (! is_string($body) || trim($body) === '') {
            $entry->delete();

            return null;
        }

        return new Response(HttpFactory::psr7Response(
            $body,
            (int) ($entry->status_code ?? 200),
            [
                'Content-Type' => 'application/json',
                'X-Animabook-Cache' => 'jikan-hit',
            ],
        ));
    }

    public function put(string $path, array $query, Response $response): void
    {
        $endpoint = $this->normalizeEndpoint($path);
        if (! $this->enabledFor($endpoint)) {
            return;
        }

        $body = $response->body();
        if (! $this->shouldStore($response->status(), $body)) {
            return;
        }

        $ttlSeconds = $this->ttlForStatus($response->status());
        if ($ttlSeconds <= 0) {
            return;
        }

        $now = CarbonImmutable::now();

        JikanCache::query()->updateOrCreate(
            ['key' => $this->cacheKey($endpoint, $query)],
            [
                'endpoint' => $endpoint,
                'query_json' => $this->normalizeQuery($query),
                'payload_json' => $body,
                'status_code' => $response->status(),
                'fetched_at' => $now,
                'expires_at' => $now->addSeconds($ttlSeconds),
            ],
        );
    }

    private function enabledFor(string $endpoint): bool
    {
        if (! (bool) config('jikan.cache.enabled', false)) {
            return false;
        }

        $excluded = config('jikan.cache.exclude', []);
        if (! is_array($excluded)) {
            return true;
        }

        foreach ($excluded as $pattern) {
            if (is_string($pattern) && Str::is($pattern, $endpoint)) {
                return false;
            }
        }

        return true;
    }

    private function shouldStore(int $status, string $body): bool
    {
        if (trim($body) === '') {
            return false;
        }

        return ($status >= 200 && $status < 300) || $status === 404;
    }

    private function ttlForStatus(int $status): int
    {
        if ($status === 404) {
            return max(0, (int) config('jikan.cache.negative_ttl_seconds', 120));
        }

        return max(0, (int) config('jikan.cache.default_ttl_seconds', 900));
    }

    private function normalizeEndpoint(string $path): string
    {
        return trim($path, '/');
    }

    private function cacheKey(string $endpoint, array $query): string
    {
        $signature = $endpoint;
        $normalizedQuery = $this->normalizeQuery($query);

        if ($normalizedQuery !== []) {
            $signature .= '?'.http_build_query($normalizedQuery, '', '&', PHP_QUERY_RFC3986);
        }

        return 'jikan:http:v1:'.sha1($signature);
    }

    private function normalizeQuery(array $query): array
    {
        $normalized = $query;

        foreach ($normalized as $key => $value) {
            if (is_array($value)) {
                $normalized[$key] = $this->normalizeQuery($value);
            }
        }

        ksort($normalized);

        return $normalized;
    }
}
