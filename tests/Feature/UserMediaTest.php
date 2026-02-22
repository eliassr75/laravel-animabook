<?php

use App\Models\User;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('prevents duplicate watchlist entries', function () {
    $user = User::factory()->create();

    UserMediaStatus::create([
        'user_id' => $user->id,
        'media_type' => 'anime',
        'mal_id' => 100,
        'status' => 'watching',
        'progress' => 3,
    ]);

    $thrown = false;

    try {
        UserMediaStatus::create([
            'user_id' => $user->id,
            'media_type' => 'anime',
            'mal_id' => 100,
            'status' => 'watching',
            'progress' => 4,
        ]);
    } catch (QueryException $e) {
        $thrown = true;
    }

    expect($thrown)->toBeTrue();
});

it('prevents duplicate favorites', function () {
    $user = User::factory()->create();

    UserFavorite::create([
        'user_id' => $user->id,
        'entity_type' => 'anime',
        'mal_id' => 100,
    ]);

    $thrown = false;

    try {
        UserFavorite::create([
            'user_id' => $user->id,
            'entity_type' => 'anime',
            'mal_id' => 100,
        ]);
    } catch (QueryException $e) {
        $thrown = true;
    }

    expect($thrown)->toBeTrue();
});
