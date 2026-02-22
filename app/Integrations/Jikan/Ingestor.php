<?php

namespace App\Integrations\Jikan;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class Ingestor
{
    public function __construct(
        private readonly RefreshPolicy $refreshPolicy,
    ) {
    }

    public function upsertEntity(
        string $entityType,
        int $malId,
        array $payload,
        array $indexable,
        ?string $status = null,
        ?array $payloadFull = null,
    ): void
    {
        $now = CarbonImmutable::now();
        $indexable = $this->normalizeIndexable($indexable);

        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($payloadJson === false) {
            $payloadJson = json_encode(['error' => 'payload_encode_failed'], JSON_UNESCAPED_UNICODE);
        }

        $payloadFullJson = null;
        if (is_array($payloadFull)) {
            $payloadFullJson = json_encode($payloadFull, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
            if ($payloadFullJson === false) {
                $payloadFullJson = json_encode(['error' => 'payload_full_encode_failed'], JSON_UNESCAPED_UNICODE);
            }
        }

        $payloadUpdate = [
            'payload' => $payloadJson,
            'last_fetched_at' => $now,
            'next_refresh_at' => $this->refreshPolicy->nextRefreshAt($entityType, $status, $now),
            'updated_at' => $now,
        ];

        if ($payloadFullJson !== null) {
            $payloadUpdate['payload_full'] = $payloadFullJson;
        }

        DB::table('catalog_entities')->updateOrInsert(
            [
                'entity_type' => $entityType,
                'mal_id' => $malId,
            ],
            array_merge($indexable, $payloadUpdate),
        );
    }

    private function normalizeIndexable(array $indexable): array
    {
        foreach (['images', 'trailer', 'external_links'] as $key) {
            if (array_key_exists($key, $indexable) && is_array($indexable[$key])) {
                $indexable[$key] = json_encode($indexable[$key]);
            }
        }

        return $indexable;
    }
}
