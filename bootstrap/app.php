<?php

require_once __DIR__.'/../app/Support/polyfills_sentry.php';

if (!function_exists('gethostname')) {
    function gethostname(): string
    {
        // Fallback para ambientes sem gethostname nativo (ex.: Android/Termux).
        $h = \php_uname('n');
        return (\is_string($h) && $h !== '') ? $h : 'unknown-host';
    }
}

use App\Http\Middleware\EnsureMasterUser;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Sentry\Laravel\Integration;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->alias([
            'master' => EnsureMasterUser::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();

if (isset($_SERVER['COMPOSER_AUTOLOADER_PATH'], $_SERVER['LARAVEL_BOOTSTRAP_PATH'])) {
    // NativePHP Mobile chama $kernel->bootstrap() antes do handle(),
    // então precisamos garantir que já exista Request no container.
    $app->instance('request', \Illuminate\Http\Request::capture());
}

return $app;
