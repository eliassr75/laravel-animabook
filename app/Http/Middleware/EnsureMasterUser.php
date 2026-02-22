<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMasterUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $masterEmail = mb_strtolower((string) config('animabook.master_email', 'elias.craveiro@animabook.net'));
        $email = mb_strtolower((string) optional($request->user())->email);
        if ($email !== $masterEmail) {
            abort(403);
        }

        return $next($request);
    }
}
