<?php

namespace App\Services;

use App\Models\SeoSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class SeoSettingsService
{
    private const CACHE_KEY = 'seo:settings:v1';

    public function getConfig(): array
    {
        return Cache::remember(self::CACHE_KEY, now()->addMinutes(10), function (): array {
            $base = config('seo');
            if (! is_array($base)) {
                $base = [];
            }

            if (! Schema::hasTable('seo_settings')) {
                return $base;
            }

            $override = SeoSetting::query()
                ->where('key', 'config')
                ->value('payload');

            if (! is_array($override)) {
                return $base;
            }

            return array_replace_recursive($base, $override);
        });
    }

    public function updateConfig(array $payload, User $user): array
    {
        $record = SeoSetting::query()->updateOrCreate(
            ['key' => 'config'],
            [
                'payload' => $payload,
                'updated_by' => $user->id,
            ],
        );

        Cache::forget(self::CACHE_KEY);

        return is_array($record->payload) ? $record->payload : [];
    }
}
