<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use App\Services\SeoSettingsService;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __invoke(AdminDashboardService $dashboard, SeoSettingsService $seoSettings): Response
    {
        $user = request()->user();

        $stats = UserMediaStatus::query()
            ->selectRaw('status, COUNT(*) as total')
            ->where('user_id', $user->id)
            ->groupBy('status')
            ->pluck('total', 'status');

        $meanScore = UserMediaStatus::query()
            ->where('user_id', $user->id)
            ->whereNotNull('user_score')
            ->avg('user_score');

        $favoritesCount = UserFavorite::query()
            ->where('user_id', $user->id)
            ->count();

        $trackedTotal = UserMediaStatus::query()
            ->where('user_id', $user->id)
            ->count();

        $masterEmail = mb_strtolower((string) config('animabook.master_email', 'elias.craveiro@animabook.net'));
        $isMaster = mb_strtolower((string) $user->email) === $masterEmail;
        $admin = null;

        if ($isMaster) {
            $users = $dashboard->usersPage(null, 1, 15);
            $admin = array_merge($dashboard->dashboardPayload(), [
                'users' => $users->items(),
                'usersMeta' => [
                    'currentPage' => $users->currentPage(),
                    'lastPage' => $users->lastPage(),
                    'perPage' => $users->perPage(),
                    'total' => $users->total(),
                ],
                'seoConfig' => $seoSettings->getConfig(),
            ]);
        }

        return Inertia::render('Profile', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'stats' => [
                'watching' => (int) ($stats['assistindo'] ?? 0),
                'completed' => (int) ($stats['completo'] ?? 0),
                'dropped' => (int) ($stats['dropado'] ?? 0),
                'paused' => (int) ($stats['pausado'] ?? 0),
                'planned' => (int) ($stats['planejado'] ?? 0),
                'favorites' => (int) $favoritesCount,
                'trackedTotal' => (int) $trackedTotal,
                'meanScore' => $meanScore ? round((float) $meanScore, 1) : 0,
            ],
            'isMaster' => $isMaster,
            'admin' => $admin,
        ]);
    }
}
