<?php

namespace App\Jobs;

use App\Integrations\Jikan\Endpoints\AnimeEndpoint;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use App\Integrations\Jikan\Mappers\CatalogEntityMapper;
use App\Models\IngestCursor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Throwable;

class BackfillAnimeCatalogJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 0;

    public function __construct(
        public readonly string $cursorName = 'anime_backfill',
        public readonly int $batchSize = 50,
    ) {
        $this->onQueue((string) config('animabook.backfill_anime.queue', 'low'));
    }

    public function handle(
        AnimeEndpoint $animeEndpoint,
        CatalogEntityMapper $mapper,
        Ingestor $ingestor,
        IngestBudget $budget,
    ): void {
        $lockTtl = max(30, (int) config('animabook.backfill_anime.lock_ttl_seconds', 180));
        $lock = Cache::lock("backfill:anime:{$this->cursorName}", $lockTtl);

        if (! $lock->get()) {
            return;
        }

        $cursor = null;

        try {
            $cursor = IngestCursor::query()->firstOrCreate(
                ['name' => $this->cursorName],
                [
                    'next_mal_id' => max(1, (int) config('animabook.backfill_anime.start_mal_id', 1)),
                    'is_active' => false,
                    'consecutive_misses' => 0,
                    'meta' => [],
                ],
            );

            if (! $cursor->is_active) {
                return;
            }

            $batchSize = max(1, min(500, $this->batchSize));
            $nextMalId = max(1, (int) $cursor->next_mal_id);
            $consecutiveMisses = max(0, (int) $cursor->consecutive_misses);
            $lastValidMalId = $cursor->last_valid_mal_id ? (int) $cursor->last_valid_mal_id : null;
            $processed = 0;
            $found = 0;
            $budgetExhausted = false;

            for ($malId = $nextMalId; $malId < ($nextMalId + $batchSize); $malId++) {
                if (! $budget->withinBudget('backfill_anime', 1)) {
                    $budgetExhausted = true;
                    break;
                }

                $processed++;
                $payload = $animeEndpoint->getById($malId);

                if ($payload === []) {
                    $consecutiveMisses++;
                    continue;
                }

                $consecutiveMisses = 0;
                $resolvedMalId = isset($payload['mal_id']) ? (int) $payload['mal_id'] : $malId;
                $lastValidMalId = max(1, $resolvedMalId);
                $found++;

                $indexable = $mapper->map('anime', $payload);
                $ingestor->upsertEntity(
                    'anime',
                    $lastValidMalId,
                    $payload,
                    $indexable,
                    $payload['status'] ?? null,
                    null,
                );
            }

            if ($processed > 0) {
                $cursor->next_mal_id = $nextMalId + $processed;
            }

            $cursor->last_valid_mal_id = $lastValidMalId;
            $cursor->consecutive_misses = $consecutiveMisses;
            $cursor->last_ran_at = now();
            $cursor->last_error = null;
            $cursor->meta = array_merge($cursor->meta ?? [], [
                'last_batch_size' => $batchSize,
                'last_processed' => $processed,
                'last_found' => $found,
                'last_budget_exhausted' => $budgetExhausted,
                'last_run_at' => now()->toIso8601String(),
            ]);

            if ($this->shouldAutoPause($consecutiveMisses, $lastValidMalId)) {
                $cursor->is_active = false;
                $cursor->last_error = sprintf(
                    'Auto-paused after %d consecutive misses.',
                    $consecutiveMisses,
                );
            }

            $cursor->save();

            if ($cursor->is_active) {
                self::dispatch($this->cursorName, $batchSize)
                    ->onQueue((string) config('animabook.backfill_anime.queue', 'low'))
                    ->delay($this->nextRunAt($budgetExhausted));
            }
        } catch (Throwable $e) {
            if ($cursor) {
                $cursor->last_ran_at = now();
                $cursor->last_error = $e->getMessage();
                $cursor->save();

                if ($cursor->is_active) {
                    $retryDelay = max(30, (int) config('animabook.backfill_anime.error_retry_seconds', 120));
                    self::dispatch($this->cursorName, $this->batchSize)
                        ->onQueue((string) config('animabook.backfill_anime.queue', 'low'))
                        ->delay(now()->addSeconds($retryDelay));
                }
            }

            report($e);
        } finally {
            try {
                $lock->release();
            } catch (Throwable) {
                // Best effort; lock expiry handles stale lock scenarios.
            }
        }
    }

    private function shouldAutoPause(int $consecutiveMisses, ?int $lastValidMalId): bool
    {
        $maxConsecutiveMisses = (int) config('animabook.backfill_anime.max_consecutive_misses', 5000);

        if ($maxConsecutiveMisses <= 0) {
            return false;
        }

        if ($lastValidMalId === null) {
            return false;
        }

        return $consecutiveMisses >= $maxConsecutiveMisses;
    }

    private function nextRunAt(bool $budgetExhausted): \Illuminate\Support\Carbon
    {
        if ($budgetExhausted) {
            $pauseMinutes = max(1, (int) config('animabook.backfill_anime.pause_minutes_on_budget_exhausted', 60));

            return now()->addMinutes($pauseMinutes);
        }

        $delaySeconds = max(0, (int) config('animabook.backfill_anime.delay_seconds', 2));

        return now()->addSeconds($delaySeconds);
    }
}

