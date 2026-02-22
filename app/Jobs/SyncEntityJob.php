<?php

namespace App\Jobs;

use App\Integrations\Jikan\EntityLease;
use App\Integrations\Jikan\IngestBudget;
use App\Integrations\Jikan\Ingestor;
use App\Integrations\Jikan\Endpoints\AnimeEndpoint;
use App\Integrations\Jikan\Endpoints\MangaEndpoint;
use App\Integrations\Jikan\Endpoints\CharactersEndpoint;
use App\Integrations\Jikan\Endpoints\PeopleEndpoint;
use App\Integrations\Jikan\Endpoints\ProducersEndpoint;
use App\Integrations\Jikan\Mappers\CatalogEntityMapper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SyncEntityJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 5;
    public int $backoff = 30;

    public function __construct(
        public readonly string $entityType,
        public readonly int $malId,
    ) {
        $this->onQueue('default');
    }

    public function handle(
        EntityLease $lease,
        IngestBudget $budget,
        Ingestor $ingestor,
        AnimeEndpoint $animeEndpoint,
        MangaEndpoint $mangaEndpoint,
        CharactersEndpoint $charactersEndpoint,
        PeopleEndpoint $peopleEndpoint,
        ProducersEndpoint $producersEndpoint,
        CatalogEntityMapper $mapper,
    ): void
    {
        if (! $budget->withinBudget('sync_entity', 1)) {
            return;
        }

        if (! $lease->acquire($this->entityType, $this->malId)) {
            return;
        }

        try {
            $payload = match ($this->entityType) {
                'anime' => $animeEndpoint->getById($this->malId),
                'manga' => $mangaEndpoint->getById($this->malId),
                'character' => $charactersEndpoint->getById($this->malId),
                'person' => $peopleEndpoint->getById($this->malId),
                'producer' => $producersEndpoint->getById($this->malId),
                default => [],
            };

            if ($payload === []) {
                return;
            }

            $payloadFull = null;
            if ($this->entityType === 'anime') {
                $payloadFull = $animeEndpoint->getByIdFull($this->malId);
                if ($payloadFull === []) {
                    $payloadFull = null;
                }

                $staff = $animeEndpoint->staff($this->malId);
                if ($staff !== []) {
                    if (! is_array($payloadFull)) {
                        $payloadFull = [];
                    }
                    $payloadFull['staff'] = $staff;
                }

                $stats = $animeEndpoint->statistics($this->malId);
                if ($stats !== []) {
                    if (! is_array($payloadFull)) {
                        $payloadFull = [];
                    }
                    $payloadFull['stats'] = $stats;
                }

                $characters = $animeEndpoint->characters($this->malId);
                if ($characters !== []) {
                    if (! is_array($payloadFull)) {
                        $payloadFull = [];
                    }
                    $payloadFull['characters'] = $characters;
                }

                $news = $animeEndpoint->news($this->malId);
                if ($news !== []) {
                    if (! is_array($payloadFull)) {
                        $payloadFull = [];
                    }
                    $payloadFull['news'] = $news;
                }
            }

            if ($this->entityType === 'manga') {
                $stats = $mangaEndpoint->statistics($this->malId);
                if ($stats !== []) {
                    $payloadFull = ['stats' => $stats];
                }

                $characters = $mangaEndpoint->characters($this->malId);
                if ($characters !== []) {
                    if (! is_array($payloadFull)) {
                        $payloadFull = [];
                    }
                    $payloadFull['characters'] = $characters;
                }

                $news = $mangaEndpoint->news($this->malId);
                if ($news !== []) {
                    if (! is_array($payloadFull)) {
                        $payloadFull = [];
                    }
                    $payloadFull['news'] = $news;
                }
            }

            $indexable = $mapper->map($this->entityType, $payload);

            $ingestor->upsertEntity(
                $this->entityType,
                $this->malId,
                $payload,
                $indexable,
                $payload['status'] ?? null,
                $payloadFull,
            );

            if (in_array($this->entityType, ['anime', 'manga'], true)) {
                SyncRelationsJob::dispatch($this->entityType, $this->malId)->onQueue('low');
            }
        } catch (\Throwable $e) {
            DB::table('catalog_entities')
                ->where('entity_type', $this->entityType)
                ->where('mal_id', $this->malId)
                ->update([
                    'fetch_failures' => DB::raw('fetch_failures + 1'),
                    'last_error' => $e->getMessage(),
                    'updated_at' => now(),
                ]);

            throw $e;
        } finally {
            $lease->release($this->entityType, $this->malId);
        }
    }
}
