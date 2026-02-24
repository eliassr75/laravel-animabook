<?php

return [
    'master_email' => env('ANIMABOOK_MASTER_EMAIL', 'elias.craveiro@animabook.net'),
    'backfill_anime' => [
        'queue' => env('ANIMABOOK_BACKFILL_ANIME_QUEUE', 'low'),
        'start_mal_id' => (int) env('ANIMABOOK_BACKFILL_ANIME_START_MAL_ID', 1),
        'batch_size' => (int) env('ANIMABOOK_BACKFILL_ANIME_BATCH_SIZE', 50),
        'delay_seconds' => (int) env('ANIMABOOK_BACKFILL_ANIME_DELAY_SECONDS', 2),
        'lock_ttl_seconds' => (int) env('ANIMABOOK_BACKFILL_ANIME_LOCK_TTL_SECONDS', 180),
        'error_retry_seconds' => (int) env('ANIMABOOK_BACKFILL_ANIME_ERROR_RETRY_SECONDS', 120),
        'pause_minutes_on_budget_exhausted' => (int) env('ANIMABOOK_BACKFILL_ANIME_BUDGET_PAUSE_MINUTES', 60),
        'max_consecutive_misses' => (int) env('ANIMABOOK_BACKFILL_ANIME_MAX_CONSECUTIVE_MISSES', 5000),
    ],
];
