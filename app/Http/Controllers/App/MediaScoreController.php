<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\UserMediaActionsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MediaScoreController extends Controller
{
    public function __invoke(Request $request, UserMediaActionsService $actions): JsonResponse
    {
        $payload = $request->validate([
            'media_type' => ['required', Rule::in(['anime', 'manga'])],
            'mal_id' => ['required', 'integer', 'min:1'],
            'user_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
        ]);

        $score = isset($payload['user_score'])
            ? round((float) $payload['user_score'], 1)
            : null;

        $state = $actions->setScore(
            $request->user(),
            (string) $payload['media_type'],
            (int) $payload['mal_id'],
            $score,
        );

        return response()->json([
            'state' => $state,
            'user_score' => $score,
        ]);
    }
}
