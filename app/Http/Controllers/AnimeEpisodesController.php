<?php

namespace App\Http\Controllers;

use App\Integrations\Jikan\Endpoints\AnimeEndpoint;
use App\Services\AnimeEpisodesService;
use Illuminate\Http\JsonResponse;

class AnimeEpisodesController extends Controller
{
    public function index(int $malId, AnimeEpisodesService $episodesService): JsonResponse
    {
        $page = max(1, (int) request()->integer('page', 1));
        $force = request()->boolean('force', false);
        $perPage = 100;
        $all = collect($episodesService->forAnime($malId, $force));
        $total = $all->count();
        $items = $all
            ->forPage($page, $perPage)
            ->values()
            ->all();
        $lastPage = max(1, (int) ceil($total / $perPage));

        return response()->json([
            'items' => $items,
            'pagination' => [
                'has_next_page' => $page < $lastPage,
                'current_page' => $page,
                'last_visible_page' => $lastPage,
            ],
        ]);
    }

    public function show(int $malId, int $episode, AnimeEndpoint $anime): JsonResponse
    {
        $data = $anime->episode($malId, $episode);

        return response()->json([
            'item' => [
                'number' => (int) ($data['mal_id'] ?? $episode),
                'title' => $data['title'] ?? null,
                'titleJapanese' => $data['title_japanese'] ?? null,
                'duration' => $data['duration'] ?? null,
                'aired' => $data['aired'] ?? null,
                'synopsis' => $data['synopsis'] ?? null,
                'filler' => (bool) ($data['filler'] ?? false),
                'recap' => (bool) ($data['recap'] ?? false),
            ],
        ]);
    }
}
