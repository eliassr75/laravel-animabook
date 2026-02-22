<?php

namespace App\Integrations\Jikan;

use Carbon\CarbonImmutable;

class RefreshPolicy
{
    public function nextRefreshAt(string $entityType, ?string $status, ?CarbonImmutable $lastFetchedAt): CarbonImmutable
    {
        $base = $lastFetchedAt ?? CarbonImmutable::now();

        return match ($entityType) {
            'anime', 'manga' => $this->nextForMedia($base, $status),
            default => $base->addDays(14),
        };
    }

    private function nextForMedia(CarbonImmutable $base, ?string $status): CarbonImmutable
    {
        if ($status === null) {
            return $base->addDays(7);
        }

        return match (mb_strtolower($status)) {
            'airing', 'publishing', 'em exibição', 'em exibicao' => $base->addDays(1),
            'finished', 'complete', 'finalizado' => $base->addDays(30),
            default => $base->addDays(7),
        };
    }
}
