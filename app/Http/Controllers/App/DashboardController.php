<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\UserMediaStatus;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();

        $stats = UserMediaStatus::query()
            ->selectRaw('status, COUNT(*) as total')
            ->where('user_id', $user->id)
            ->groupBy('status')
            ->pluck('total', 'status');

        $completedCount = (int) ($stats['completo'] ?? 0);
        $meanScore = UserMediaStatus::query()
            ->where('user_id', $user->id)
            ->whereNotNull('user_score')
            ->avg('user_score');

        $totalEpisodes = UserMediaStatus::query()
            ->where('user_id', $user->id)
            ->sum('progress');

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'stats' => [
                        'watching' => (int) ($stats['assistindo'] ?? 0),
                        'completed' => $completedCount,
                        'planned' => (int) ($stats['planejado'] ?? 0),
                        'paused' => (int) ($stats['pausado'] ?? 0),
                        'dropped' => (int) ($stats['dropado'] ?? 0),
                        'totalEpisodes' => (int) $totalEpisodes,
                        'meanScore' => $meanScore ? round((float) $meanScore, 1) : 0,
                    ],
                ],
            ],
            'watchlistCount' => UserMediaStatus::query()
                ->where('user_id', $user->id)
                ->count(),
        ]);
    }
}
