<?php

namespace App\Integrations\Jikan\DTO;

class CatalogItem
{
    public function __construct(
        public readonly string $entityType,
        public readonly int $malId,
        public readonly array $payload,
    ) {}
}
