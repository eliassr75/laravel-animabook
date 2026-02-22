<?php

namespace App\Integrations\Jikan;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class IngestBudget
{
    public function withinBudget(string $bucket, int $cost = 1): bool
    {
        $today = CarbonImmutable::now()->toDateString();

        return DB::transaction(function () use ($bucket, $today, $cost): bool {
            $row = DB::table('ingest_budgets')
                ->where('bucket', $bucket)
                ->where('day', $today)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                DB::table('ingest_budgets')->insert([
                    'bucket' => $bucket,
                    'day' => $today,
                    'limit' => 10000,
                    'used' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $row = (object) [
                    'limit' => 10000,
                    'used' => 0,
                ];
            }

            if (($row->used + $cost) > $row->limit) {
                return false;
            }

            DB::table('ingest_budgets')
                ->where('bucket', $bucket)
                ->where('day', $today)
                ->update([
                    'used' => $row->used + $cost,
                    'updated_at' => now(),
                ]);

            return true;
        });
    }
}
