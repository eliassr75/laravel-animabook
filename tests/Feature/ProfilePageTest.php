<?php

use App\Models\User;
use App\Models\UserFavorite;
use App\Models\UserMediaStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('redirects guest from app profile page', function () {
    $response = $this->get('/app/perfil');

    $response->assertRedirect(route('login'));
});

it('renders app profile page with aggregated user stats', function () {
    $user = User::factory()->create();

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'anime',
        'mal_id' => 1,
        'status' => 'assistindo',
        'progress' => 3,
        'user_score' => null,
    ]);

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'anime',
        'mal_id' => 2,
        'status' => 'completo',
        'progress' => 24,
        'user_score' => 8.5,
    ]);

    UserMediaStatus::query()->create([
        'user_id' => $user->id,
        'media_type' => 'manga',
        'mal_id' => 3,
        'status' => 'dropado',
        'progress' => 4,
        'user_score' => 6.0,
    ]);

    UserFavorite::query()->create([
        'user_id' => $user->id,
        'entity_type' => 'anime',
        'mal_id' => 2,
    ]);

    UserFavorite::query()->create([
        'user_id' => $user->id,
        'entity_type' => 'manga',
        'mal_id' => 10,
    ]);

    $response = $this->actingAs($user)->get('/app/perfil');

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Profile')
        ->where('profile.name', $user->name)
        ->where('profile.email', $user->email)
        ->where('stats.watching', 1)
        ->where('stats.completed', 1)
        ->where('stats.dropped', 1)
        ->where('stats.favorites', 2)
        ->where('stats.trackedTotal', 3)
        ->where('stats.meanScore', 7.3)
    );
});
