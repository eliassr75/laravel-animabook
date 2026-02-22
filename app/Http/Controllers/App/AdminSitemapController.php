<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\SitemapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSitemapController extends Controller
{
    public function __invoke(Request $request, SitemapService $sitemap): JsonResponse
    {
        $payload = $request->validate([
            'write_file' => ['nullable', 'boolean'],
        ]);

        $result = $sitemap->refresh((bool) ($payload['write_file'] ?? false));

        return response()->json([
            'ok' => true,
            'result' => $result,
        ]);
    }
}
