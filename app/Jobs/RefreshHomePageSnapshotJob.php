<?php

namespace App\Jobs;

use App\Services\HomePageSnapshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RefreshHomePageSnapshotJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $uniqueFor = 300;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(HomePageSnapshotService $homePageSnapshotService): void
    {
        $homePageSnapshotService->refresh();
    }

    public function uniqueId(): string
    {
        return HomePageSnapshotService::SNAPSHOT_KEY;
    }
}
