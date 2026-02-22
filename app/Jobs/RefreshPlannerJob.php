<?php

namespace App\Jobs;

use App\Models\CatalogEntity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RefreshPlannerJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $due = CatalogEntity::query()
            ->whereNotNull('next_refresh_at')
            ->where('next_refresh_at', '<=', now())
            ->limit(500)
            ->get();

        foreach ($due as $entity) {
            SyncEntityJob::dispatch($entity->entity_type, (int) $entity->mal_id)->onQueue('default');
        }
    }
}
