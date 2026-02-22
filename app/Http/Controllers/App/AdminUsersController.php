<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUsersController extends Controller
{
    public function __invoke(Request $request, AdminDashboardService $dashboard): JsonResponse
    {
        $payload = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ]);

        $search = isset($payload['search']) ? (string) $payload['search'] : null;
        $page = isset($payload['page']) ? (int) $payload['page'] : 1;
        $perPage = isset($payload['per_page']) ? (int) $payload['per_page'] : 15;

        $users = $dashboard->usersPage($search, $page, $perPage);

        return response()->json([
            'items' => $users->items(),
            'meta' => [
                'currentPage' => $users->currentPage(),
                'lastPage' => $users->lastPage(),
                'perPage' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
