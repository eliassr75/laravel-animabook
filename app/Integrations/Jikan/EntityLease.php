<?php

namespace App\Integrations\Jikan;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class EntityLease
{
    public function acquire(string $entityType, int $malId, int $minutes = 10, ?string $lockedBy = null): bool
    {
        $now = CarbonImmutable::now();
        $lockedBy = $lockedBy ?? gethostname() ?: 'worker';

        return DB::transaction(function () use ($entityType, $malId, $minutes, $lockedBy, $now): bool {
            $row = DB::table('ingest_leases')
                ->where('entity_type', $entityType)
                ->where('mal_id', $malId)
                ->lockForUpdate()
                ->first();

            if ($row && $row->lease_expires_at && CarbonImmutable::parse($row->lease_expires_at)->isFuture()) {
                return false;
            }

            $payload = [
                'entity_type' => $entityType,
                'mal_id' => $malId,
                'lease_expires_at' => $now->addMinutes($minutes),
                'locked_at' => $now,
                'locked_by' => $lockedBy,
                'updated_at' => $now,
            ];

            if (! $row) {
                $payload['created_at'] = $now;
                DB::table('ingest_leases')->insert($payload);
            } else {
                DB::table('ingest_leases')
                    ->where('entity_type', $entityType)
                    ->where('mal_id', $malId)
                    ->update($payload);
            }

            return true;
        });
    }

    public function release(string $entityType, int $malId): void
    {
        DB::table('ingest_leases')
            ->where('entity_type', $entityType)
            ->where('mal_id', $malId)
            ->update([
                'lease_expires_at' => null,
                'updated_at' => now(),
            ]);
    }
}
