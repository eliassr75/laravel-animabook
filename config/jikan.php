<?php

return [
    'base_url' => env('JIKAN_BASE_URL', 'https://api.jikan.moe/v4'),
    'timeout' => (int) env('JIKAN_TIMEOUT', 12),
    'retry_times' => (int) env('JIKAN_RETRY_TIMES', 2),
    'retry_sleep_ms' => (int) env('JIKAN_RETRY_SLEEP_MS', 500),
    'user_agent' => env('JIKAN_USER_AGENT', 'Animabook/1.0 (+https://animabook.local)'),
    'max_concurrency' => (int) env('JIKAN_MAX_CONCURRENCY', 2),
    'lock_ttl' => (int) env('JIKAN_LOCK_TTL', 30),
    'lock_wait_ms' => (int) env('JIKAN_LOCK_WAIT_MS', 5000),
    'min_interval_ms' => (int) env('JIKAN_MIN_INTERVAL_MS', 350),
    'rate_lock_ttl' => (int) env('JIKAN_RATE_LOCK_TTL', 10),
    'headers' => [
        'Accept' => 'application/json',
    ],
];
