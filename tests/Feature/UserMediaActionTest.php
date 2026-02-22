<?php

use App\Models\User;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('toggles favorite action for authenticated user', function () {
    $user = User::factory()->create();

    $first = $this->actingAs($user)->postJson('/app/media-actions', [
        'media_type' => 'anime',
        'mal_id' => 123,
        'action' => 'favorite',
    ]);

    $first->assertOk()->assertJsonPath('state.favorite', true);
    expect(UserFavorite::query()->where('user_id', $user->id)->count())->toBe(1);

    $second = $this->actingAs($user)->postJson('/app/media-actions', [
        'media_type' => 'anime',
        'mal_id' => 123,
        'action' => 'favorite',
    ]);

    $second->assertOk()->assertJsonPath('state.favorite', false);
    expect(UserFavorite::query()->where('user_id', $user->id)->count())->toBe(0);
});

it('sets media status action for authenticated user', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/app/media-actions', [
        'media_type' => 'manga',
        'mal_id' => 456,
        'action' => 'watching',
    ]);

    $response->assertOk()->assertJsonPath('state.status', 'assistindo');

    $stored = UserMediaStatus::query()
        ->where('user_id', $user->id)
        ->where('media_type', 'manga')
        ->where('mal_id', 456)
        ->first();

    expect($stored)->not()->toBeNull();
    expect($stored?->status)->toBe('assistindo');
});

it('toggles off media status action when clicking the same status again', function () {
    $user = User::factory()->create();

    $first = $this->actingAs($user)->postJson('/app/media-actions', [
        'media_type' => 'anime',
        'mal_id' => 777,
        'action' => 'completed',
    ]);

    $first->assertOk()->assertJsonPath('state.status', 'completo');

    $second = $this->actingAs($user)->postJson('/app/media-actions', [
        'media_type' => 'anime',
        'mal_id' => 777,
        'action' => 'completed',
    ]);

    $second->assertOk()->assertJsonPath('state.status', null);

    $stored = UserMediaStatus::query()
        ->where('user_id', $user->id)
        ->where('media_type', 'anime')
        ->where('mal_id', 777)
        ->first();

    expect($stored)->toBeNull();
});

it('saves user score for authenticated user media', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/app/media-score', [
        'media_type' => 'anime',
        'mal_id' => 999,
        'user_score' => 9.5,
    ]);

    $response->assertOk()->assertJsonPath('user_score', 9.5);

    $stored = UserMediaStatus::query()
        ->where('user_id', $user->id)
        ->where('media_type', 'anime')
        ->where('mal_id', 999)
        ->first();

    expect($stored)->not()->toBeNull();
    expect((float) $stored?->user_score)->toBe(9.5);
    expect($stored?->status)->toBe('planejado');
});
