<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\UserMediaStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MediaEpisodeProgressController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'media_type' => ['required', Rule::in(['anime'])],
            'mal_id' => ['required', 'integer', 'min:1'],
            'watched_episodes' => ['required', 'array'],
            'watched_episodes.*' => ['integer', 'min:1'],
        ]);

        $watchedEpisodes = collect($payload['watched_episodes'])
            ->map(fn ($episode) => (int) $episode)
            ->filter(fn ($episode) => $episode > 0)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $entry = UserMediaStatus::query()->firstOrNew([
            'user_id' => $request->user()->id,
            'media_type' => 'anime',
            'mal_id' => (int) $payload['mal_id'],
        ]);

        $existingNotes = [];
        if (is_string($entry->notes) && $entry->notes !== '') {
            $decoded = json_decode($entry->notes, true);
            if (is_array($decoded)) {
                $existingNotes = $decoded;
            }
        }

        $existingNotes['watched_episodes'] = $watchedEpisodes;

        if (! $entry->exists && empty($entry->status)) {
            $entry->status = 'assistindo';
        }

        $entry->progress = count($watchedEpisodes);
        $entry->notes = json_encode($existingNotes, JSON_UNESCAPED_UNICODE);
        $entry->save();

        return response()->json([
            'progress' => $entry->progress,
            'watched_episodes' => $watchedEpisodes,
        ]);
    }
}
