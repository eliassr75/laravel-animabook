<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\SeoSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSeoController extends Controller
{
    public function __invoke(Request $request, SeoSettingsService $settings): JsonResponse
    {
        $payload = $request->validate([
            'global' => ['required', 'array'],
            'static' => ['required', 'array'],
            'dynamic' => ['required', 'array'],
            'sitemap' => ['nullable', 'array'],
        ]);

        $updated = $settings->updateConfig([
            'global' => $payload['global'],
            'static' => $payload['static'],
            'dynamic' => $payload['dynamic'],
            'sitemap' => $payload['sitemap'] ?? [],
        ], $request->user());

        return response()->json([
            'ok' => true,
            'config' => $updated,
        ]);
    }
}
