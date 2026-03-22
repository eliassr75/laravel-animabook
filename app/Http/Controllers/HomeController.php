<?php

namespace App\Http\Controllers;

use App\Services\HomePageSnapshotService;
use App\Services\UserMediaActionsService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(UserMediaActionsService $actions, HomePageSnapshotService $homePageSnapshotService): Response
    {
        $publicPayload = $homePageSnapshotService->resolve();

        $user = request()->user();
        $allIds = collect($publicPayload['topAnime'] ?? [])
            ->pluck('malId')
            ->merge(collect($publicPayload['currentSeason'] ?? [])->pluck('malId'))
            ->merge(collect($publicPayload['recommendations'] ?? [])->pluck('malId'))
            ->unique()
            ->values()
            ->all();
        $actionStates = $user ? $actions->statesFor($user, 'anime', $allIds) : [];

        return Inertia::render('Index', [
            'topAnime' => $this->withActionStates($publicPayload['topAnime'] ?? [], $actionStates),
            'currentSeason' => $this->withActionStates($publicPayload['currentSeason'] ?? [], $actionStates),
            'recommendations' => $this->withActionStates($publicPayload['recommendations'] ?? [], $actionStates),
            'recentReviews' => $publicPayload['recentReviews'] ?? [],
            'recentNews' => $publicPayload['recentNews'] ?? [],
            'baseStats' => $publicPayload['baseStats'] ?? [],
        ]);
    }

    private function withActionStates(array $items, array $actionStates): array
    {
        return collect($items)
            ->map(function (array $item) use ($actionStates) {
                $malId = (int) ($item['malId'] ?? 0);
                $item['userActions'] = $actionStates[$malId] ?? null;

                return $item;
            })
            ->values()
            ->all();
    }
}
