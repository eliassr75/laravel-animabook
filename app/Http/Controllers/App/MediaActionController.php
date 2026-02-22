<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\UserMediaActionsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MediaActionController extends Controller
{
    public function __invoke(Request $request, UserMediaActionsService $actions): JsonResponse
    {
        $payload = $request->validate([
            'media_type' => ['required', Rule::in(['anime', 'manga'])],
            'mal_id' => ['required', 'integer', 'min:1'],
            'action' => ['required', Rule::in(['favorite', 'watching', 'completed', 'dropped'])],
        ]);

        $state = $actions->apply(
            $request->user(),
            (string) $payload['media_type'],
            (int) $payload['mal_id'],
            (string) $payload['action'],
        );

        return response()->json([
            'state' => $state,
        ]);
    }
}
