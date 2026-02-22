<?php

namespace App\Services;

use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use App\Models\User;

class UserMediaActionsService
{
    private const STATUS_MAP = [
        'watching' => 'assistindo',
        'completed' => 'completo',
        'dropped' => 'dropado',
    ];

    public function statesFor(User $user, string $mediaType, array $malIds): array
    {
        $mediaType = $this->normalizeMediaType($mediaType);
        $ids = collect($malIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($mediaType === null || $ids === []) {
            return [];
        }

        $favorites = UserFavorite::query()
            ->where('user_id', $user->id)
            ->where('entity_type', $mediaType)
            ->whereIn('mal_id', $ids)
            ->pluck('mal_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $statusByMalId = UserMediaStatus::query()
            ->where('user_id', $user->id)
            ->where('media_type', $mediaType)
            ->whereIn('mal_id', $ids)
            ->pluck('status', 'mal_id')
            ->all();

        $favoriteSet = array_fill_keys($favorites, true);
        $states = [];

        foreach ($ids as $malId) {
            $states[$malId] = [
                'favorite' => isset($favoriteSet[$malId]),
                'status' => $statusByMalId[$malId] ?? null,
            ];
        }

        return $states;
    }

    public function stateFor(User $user, string $mediaType, int $malId): array
    {
        return $this->statesFor($user, $mediaType, [$malId])[$malId] ?? [
            'favorite' => false,
            'status' => null,
        ];
    }

    public function apply(User $user, string $mediaType, int $malId, string $action): array
    {
        $mediaType = $this->normalizeMediaType($mediaType);
        if ($mediaType === null) {
            return [
                'favorite' => false,
                'status' => null,
            ];
        }

        if ($action === 'favorite') {
            $existing = UserFavorite::query()
                ->where('user_id', $user->id)
                ->where('entity_type', $mediaType)
                ->where('mal_id', $malId)
                ->first();

            if ($existing) {
                $existing->delete();
            } else {
                UserFavorite::query()->create([
                    'user_id' => $user->id,
                    'entity_type' => $mediaType,
                    'mal_id' => $malId,
                ]);
            }
        } elseif (isset(self::STATUS_MAP[$action])) {
            $targetStatus = self::STATUS_MAP[$action];
            $existing = UserMediaStatus::query()
                ->where('user_id', $user->id)
                ->where('media_type', $mediaType)
                ->where('mal_id', $malId)
                ->first();

            if ($existing && $existing->status === $targetStatus) {
                if ($this->hasTrackingData($existing)) {
                    $existing->status = 'planejado';
                    $existing->save();
                } else {
                    $existing->delete();
                }
            } else {
                UserMediaStatus::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'media_type' => $mediaType,
                        'mal_id' => $malId,
                    ],
                    [
                        'status' => $targetStatus,
                    ],
                );
            }
        }

        return $this->stateFor($user, $mediaType, $malId);
    }

    public function setScore(User $user, string $mediaType, int $malId, ?float $score): array
    {
        $mediaType = $this->normalizeMediaType($mediaType);
        if ($mediaType === null) {
            return [
                'favorite' => false,
                'status' => null,
            ];
        }

        $entry = UserMediaStatus::query()->firstOrNew([
            'user_id' => $user->id,
            'media_type' => $mediaType,
            'mal_id' => $malId,
        ]);

        if (! $entry->exists && empty($entry->status)) {
            $entry->status = 'planejado';
        }

        $entry->user_score = $score;
        $entry->save();

        return $this->stateFor($user, $mediaType, $malId);
    }

    private function normalizeMediaType(string $mediaType): ?string
    {
        $normalized = mb_strtolower(trim($mediaType));
        if (! in_array($normalized, ['anime', 'manga'], true)) {
            return null;
        }

        return $normalized;
    }

    private function hasTrackingData(UserMediaStatus $entry): bool
    {
        if ((int) $entry->progress > 0) {
            return true;
        }

        if ($entry->user_score !== null) {
            return true;
        }

        if (is_string($entry->notes) && trim($entry->notes) !== '') {
            return true;
        }

        return false;
    }
}
