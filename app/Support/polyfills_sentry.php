<?php
declare(strict_types=1);

namespace Sentry;

if (!function_exists(__NAMESPACE__ . '\gethostname')) {
    function gethostname(): string
    {
        // tenta o global (se existir)
        if (\function_exists('gethostname')) {
            $h = \gethostname();
            if (\is_string($h) && $h !== '') {
                return $h;
            }
        }

        // fallback comum
        $h = \php_uname('n');
        return (\is_string($h) && $h !== '') ? $h : 'unknown-host';
    }
}
