<?php

namespace App\Services;

use App\Models\CatalogEntity;
use App\Models\User;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use App\Models\UserReview;
use App\Models\UserVote;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    private function masterEmail(): string
    {
        return mb_strtolower((string) config('animabook.master_email', 'elias.craveiro@animabook.net'));
    }

    public function dashboardPayload(): array
    {
        return Cache::remember('admin:dashboard:v1', now()->addMinutes(5), function (): array {
            return [
                'overview' => $this->overview(),
                'trends' => $this->trends(14),
                'topUsers' => $this->topUsers(10),
            ];
        });
    }

    public function usersPage(?string $search = null, int $page = 1, int $perPage = 15): LengthAwarePaginator
    {
        $safePerPage = min(max(5, $perPage), 50);

        $query = User::query()
            ->when(is_string($search) && trim($search) !== '', function ($q) use ($search) {
                $needle = trim((string) $search);
                $q->where(function ($sub) use ($needle) {
                    $sub->where('name', 'like', "%{$needle}%")
                        ->orWhere('email', 'like', "%{$needle}%");
                });
            })
            ->withCount([
                'mediaStatuses as statuses_count',
                'favorites as favorites_count',
                'reviews as reviews_count',
                'votes as votes_count',
            ])
            ->orderByDesc('created_at');

        $paginator = $query->paginate($safePerPage, ['*'], 'page', max(1, $page));

        $collection = $paginator->getCollection()
            ->map(function (User $user) {
                $score = $this->userScore($user);
                $masterEmail = $this->masterEmail();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'emailVerified' => $user->email_verified_at !== null,
                    'createdAt' => optional($user->created_at)->toDateString(),
                    'statusesCount' => (int) ($user->statuses_count ?? 0),
                    'favoritesCount' => (int) ($user->favorites_count ?? 0),
                    'reviewsCount' => (int) ($user->reviews_count ?? 0),
                    'votesCount' => (int) ($user->votes_count ?? 0),
                    'activityScore' => $score,
                    'isMaster' => mb_strtolower((string) $user->email) === $masterEmail,
                ];
            })
            ->values();

        $paginator->setCollection($collection);

        return $paginator;
    }

    private function overview(): array
    {
        $entityCounts = CatalogEntity::query()
            ->select('entity_type', DB::raw('COUNT(*) as total'))
            ->groupBy('entity_type')
            ->pluck('total', 'entity_type');

        return [
            'usersTotal' => User::query()->count(),
            'usersVerified' => User::query()->whereNotNull('email_verified_at')->count(),
            'usersNew7d' => User::query()->where('created_at', '>=', now()->subDays(7))->count(),
            'catalogTotal' => CatalogEntity::query()->count(),
            'animeTotal' => (int) ($entityCounts['anime'] ?? 0),
            'mangaTotal' => (int) ($entityCounts['manga'] ?? 0),
            'charactersTotal' => (int) ($entityCounts['character'] ?? 0),
            'peopleTotal' => (int) ($entityCounts['person'] ?? 0),
            'favoritesTotal' => UserFavorite::query()->count(),
            'statusesTotal' => UserMediaStatus::query()->count(),
            'reviewsTotal' => UserReview::query()->count(),
            'votesTotal' => UserVote::query()->count(),
        ];
    }

    private function trends(int $days): array
    {
        return [
            'registrations' => $this->dailyTrend('users', 'created_at', $days),
            'catalogIngest' => $this->dailyTrend('catalog_entities', 'created_at', $days),
            'interactions' => $this->interactionTrend($days),
        ];
    }

    private function dailyTrend(string $table, string $column, int $days): array
    {
        $start = Carbon::now()->startOfDay()->subDays(max(1, $days) - 1);
        $rows = DB::table($table)
            ->selectRaw("DATE({$column}) as day, COUNT(*) as total")
            ->where($column, '>=', $start)
            ->groupByRaw("DATE({$column})")
            ->orderByRaw("DATE({$column})")
            ->get();

        $map = $rows->pluck('total', 'day');

        return collect(range(0, max(1, $days) - 1))
            ->map(function (int $offset) use ($start, $map) {
                $date = $start->copy()->addDays($offset);
                $key = $date->toDateString();

                return [
                    'label' => $date->format('d/m'),
                    'value' => (int) ($map[$key] ?? 0),
                ];
            })
            ->all();
    }

    private function interactionTrend(int $days): array
    {
        $sources = [
            ['table' => 'user_media_status', 'column' => 'updated_at'],
            ['table' => 'user_favorites', 'column' => 'created_at'],
            ['table' => 'user_reviews', 'column' => 'created_at'],
            ['table' => 'user_votes', 'column' => 'created_at'],
        ];

        $start = Carbon::now()->startOfDay()->subDays(max(1, $days) - 1);
        $totals = [];

        foreach ($sources as $source) {
            $rows = DB::table($source['table'])
                ->selectRaw("DATE({$source['column']}) as day, COUNT(*) as total")
                ->where($source['column'], '>=', $start)
                ->groupByRaw("DATE({$source['column']})")
                ->get();

            foreach ($rows as $row) {
                $day = (string) ($row->day ?? '');
                if ($day === '') {
                    continue;
                }
                $totals[$day] = ($totals[$day] ?? 0) + (int) ($row->total ?? 0);
            }
        }

        return collect(range(0, max(1, $days) - 1))
            ->map(function (int $offset) use ($start, $totals) {
                $date = $start->copy()->addDays($offset);
                $key = $date->toDateString();

                return [
                    'label' => $date->format('d/m'),
                    'value' => (int) ($totals[$key] ?? 0),
                ];
            })
            ->all();
    }

    private function topUsers(int $limit): array
    {
        $users = User::query()
            ->withCount([
                'mediaStatuses as statuses_count',
                'favorites as favorites_count',
                'reviews as reviews_count',
                'votes as votes_count',
            ])
            ->orderByDesc('updated_at')
            ->limit(200)
            ->get()
            ->map(function (User $user) {
                $score = $this->userScore($user);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'statusesCount' => (int) ($user->statuses_count ?? 0),
                    'favoritesCount' => (int) ($user->favorites_count ?? 0),
                    'reviewsCount' => (int) ($user->reviews_count ?? 0),
                    'votesCount' => (int) ($user->votes_count ?? 0),
                    'activityScore' => $score,
                ];
            })
            ->sortByDesc('activityScore')
            ->take(max(1, $limit))
            ->values();

        return $users->all();
    }

    private function userScore(User $user): int
    {
        return ((int) ($user->statuses_count ?? 0) * 2)
            + ((int) ($user->favorites_count ?? 0) * 2)
            + ((int) ($user->reviews_count ?? 0) * 3)
            + ((int) ($user->votes_count ?? 0));
    }
}
