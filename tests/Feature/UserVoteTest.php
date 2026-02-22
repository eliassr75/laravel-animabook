<?php

use App\Models\User;
use App\Models\UserVote;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('enforces unique vote per user and scope', function () {
    $user = User::factory()->create();

    UserVote::create([
        'user_id' => $user->id,
        'scope' => 'anime_top_2026',
        'anime_mal_id' => 1,
        'value' => 1,
    ]);

    $thrown = false;

    try {
        UserVote::create([
            'user_id' => $user->id,
            'scope' => 'anime_top_2026',
            'anime_mal_id' => 2,
            'value' => 1,
        ]);
    } catch (QueryException $e) {
        $thrown = true;
    }

    expect($thrown)->toBeTrue();
});
