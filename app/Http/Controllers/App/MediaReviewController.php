<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\CatalogEntity;
use App\Models\UserReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MediaReviewController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'media_type' => ['required', Rule::in(['anime', 'manga'])],
            'mal_id' => ['required', 'integer', 'min:1'],
            'score' => ['required', 'numeric', 'min:0', 'max:10'],
            'review' => ['required', 'string', 'min:20', 'max:4000'],
            'is_spoiler' => ['nullable', 'boolean'],
        ]);

        $mediaType = (string) $payload['media_type'];
        $malId = (int) $payload['mal_id'];
        $score = round((float) $payload['score'], 1);
        $reviewText = trim((string) $payload['review']);

        $review = UserReview::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'media_type' => $mediaType,
                'mal_id' => $malId,
            ],
            [
                'score' => $score,
                'review' => $reviewText,
                'is_spoiler' => (bool) ($payload['is_spoiler'] ?? false),
            ],
        );

        return response()->json([
            'review' => $this->presentReview($review->fresh(['user'])),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'media_type' => ['required', Rule::in(['anime', 'manga'])],
            'mal_id' => ['required', 'integer', 'min:1'],
        ]);

        UserReview::query()
            ->where('user_id', $request->user()->id)
            ->where('media_type', (string) $payload['media_type'])
            ->where('mal_id', (int) $payload['mal_id'])
            ->delete();

        return response()->json(['ok' => true]);
    }

    private function presentReview(UserReview $review): array
    {
        $entity = CatalogEntity::query()
            ->where('entity_type', $review->media_type)
            ->where('mal_id', $review->mal_id)
            ->first();

        $title = $entity?->title ?? '—';
        $id = 900_000_000_000 + $review->id;

        $base = [
            'id' => $id,
            'user' => $review->user?->name ?? 'Usuário',
            'score' => (float) $review->score,
            'content' => $review->review,
            'date' => $review->updated_at?->toIso8601String(),
            'isSpoiler' => (bool) $review->is_spoiler,
            'isMine' => true,
            'mediaType' => $review->media_type,
        ];

        if ($review->media_type === 'manga') {
            return $base + [
                'mangaTitle' => $title,
                'mangaMalId' => (int) $review->mal_id,
            ];
        }

        return $base + [
            'animeTitle' => $title,
            'animeMalId' => (int) $review->mal_id,
        ];
    }
}
