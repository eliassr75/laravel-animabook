<?php

use App\Models\CatalogEntity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createCatalogEntity(array $overrides = []): CatalogEntity
{
    $defaults = [
        'entity_type' => 'anime',
        'mal_id' => random_int(1000, 9999),
        'title' => 'Sample',
        'payload' => [],
        'payload_full' => [],
    ];

    return CatalogEntity::query()->create(array_merge($defaults, $overrides));
}

it('exposes admin payload for master user on profile page', function () {
    $master = User::factory()->create([
        'email' => 'elias.craveiro@animabook.net',
    ]);

    $response = $this->actingAs($master)->get('/app/perfil');

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Profile')
        ->where('isMaster', true)
        ->has('admin.overview')
        ->has('admin.trends.registrations')
        ->has('admin.topUsers')
        ->has('admin.users')
        ->has('admin.seoConfig')
    );
});

it('hides admin payload for non master users on profile page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/app/perfil');

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Profile')
        ->where('isMaster', false)
        ->where('admin', null)
    );
});

it('blocks non master users from admin endpoints', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/app/admin/users')->assertForbidden();
    $this->actingAs($user)->postJson('/app/admin/seo', [])->assertForbidden();
    $this->actingAs($user)->postJson('/app/admin/sitemap/refresh', [])->assertForbidden();
});

it('allows master user to update seo config', function () {
    $master = User::factory()->create([
        'email' => 'elias.craveiro@animabook.net',
    ]);

    $payload = [
        'global' => [
            'site_name' => 'Animabook',
            'title_suffix' => ' | Animabook',
            'default_title' => 'Animabook',
            'default_description' => 'Descubra animes e mangás.',
            'default_image' => '/img/ico.png',
            'robots_default' => 'index,follow',
            'twitter_site' => '@animabook',
            'noindex_query_pages' => true,
        ],
        'static' => [
            '/' => [
                'title' => 'Início',
                'description' => 'Home',
            ],
        ],
        'dynamic' => [
            'anime' => [
                'title' => '{title}',
                'description' => 'Detalhes de {title}',
            ],
        ],
        'sitemap' => [
            'cache_minutes' => 10,
            'max_urls' => 1000,
            'include_types' => ['anime'],
            'static_paths' => ['/', '/anime'],
        ],
    ];

    $response = $this->actingAs($master)->postJson('/app/admin/seo', $payload);

    $response->assertOk()->assertJsonPath('ok', true);

    $this->assertDatabaseHas('seo_settings', [
        'key' => 'config',
        'updated_by' => $master->id,
    ]);
});

it('returns sitemap xml with dynamic entries', function () {
    config(['app.url' => 'https://animabook.localhost']);

    createCatalogEntity([
        'entity_type' => 'anime',
        'mal_id' => 101,
        'title' => 'Anime A',
    ]);

    createCatalogEntity([
        'entity_type' => 'manga',
        'mal_id' => 202,
        'title' => 'Manga B',
    ]);

    $response = $this->get('/sitemap.xml');

    $response
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertSee('<urlset', false)
        ->assertSee('https://animabook.localhost/anime/101', false)
        ->assertSee('https://animabook.localhost/manga/202', false);
});

it('renders seo tags in app blade for dynamic pages', function () {
    createCatalogEntity([
        'entity_type' => 'anime',
        'mal_id' => 777,
        'title' => 'Frieren',
        'payload' => [
            'images' => [
                'jpg' => [
                    'image_url' => 'https://cdn.example.com/frieren.jpg',
                ],
            ],
        ],
        'payload_full' => [],
    ]);

    $response = $this->get('/anime/777');

    $response
        ->assertOk()
        ->assertSee('<meta name="robots"', false)
        ->assertSee('<meta property="og:title" content="Frieren | Animabook">', false)
        ->assertSee('<link rel="canonical"', false);
});

