<?php

use App\Models\User;
use App\Models\UserReview;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates or updates user review for media', function () {
    $user = User::factory()->create();

    $first = $this->actingAs($user)->postJson('/app/media-reviews', [
        'media_type' => 'anime',
        'mal_id' => 1,
        'score' => 8.5,
        'review' => 'Uma avaliação suficientemente longa para passar na validação.',
        'is_spoiler' => false,
    ]);

    $first->assertOk()->assertJsonPath('review.score', 8.5);
    expect(UserReview::query()->where('user_id', $user->id)->count())->toBe(1);

    $second = $this->actingAs($user)->postJson('/app/media-reviews', [
        'media_type' => 'anime',
        'mal_id' => 1,
        'score' => 9.0,
        'review' => 'Texto atualizado com conteúdo suficiente para manter a avaliação válida.',
        'is_spoiler' => true,
    ]);

    $second->assertOk()->assertJsonPath('review.score', 9);
    expect(UserReview::query()->where('user_id', $user->id)->count())->toBe(1);
    expect((float) UserReview::query()->firstOrFail()->score)->toBe(9.0);
});

it('deletes user review for media', function () {
    $user = User::factory()->create();

    UserReview::query()->create([
        'user_id' => $user->id,
        'media_type' => 'manga',
        'mal_id' => 12,
        'score' => 7.5,
        'review' => 'Texto inicial com quantidade mínima de caracteres.',
    ]);

    $response = $this->actingAs($user)->deleteJson('/app/media-reviews', [
        'media_type' => 'manga',
        'mal_id' => 12,
    ]);

    $response->assertOk()->assertJsonPath('ok', true);
    expect(UserReview::query()->where('user_id', $user->id)->count())->toBe(0);
});
