<?php

namespace App\Jobs;

use App\Integrations\Jikan\IngestBudget;
use App\Models\EntityRelation;
use App\Jobs\SyncEntityJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SeedPeopleFromRelationsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(IngestBudget $budget): void
    {
        if (! $budget->withinBudget('seed_people', 1)) {
            return;
        }

        $missingIds = EntityRelation::query()
            ->where('to_type', 'person')
            ->whereIn('relation_type', ['voice', 'staff'])
            ->select('to_mal_id')
            ->distinct()
            ->whereNotIn('to_mal_id', function ($sub) {
                $sub->select('mal_id')
                    ->from('catalog_entities')
                    ->where('entity_type', 'person');
            })
            ->limit(200)
            ->pluck('to_mal_id');

        foreach ($missingIds as $malId) {
            SyncEntityJob::dispatch('person', (int) $malId)->onQueue('low');
        }
    }
}
