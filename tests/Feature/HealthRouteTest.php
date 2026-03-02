<?php

use Illuminate\Support\Facades\DB;

test('health route returns ok when database is reachable', function () {
    $response = $this->get(route('health'));

    $response->assertOk();
    $response->assertJsonPath('status', 'ok');
    $response->assertJsonPath('checks.database', 'up');
});

test('health route returns degraded when database is unavailable', function () {
    DB::shouldReceive('connection->getPdo')
        ->once()
        ->andThrow(new RuntimeException('database unavailable'));

    $response = $this->get(route('health'));

    $response->assertStatus(503);
    $response->assertJsonPath('status', 'degraded');
    $response->assertJsonPath('checks.database', 'down');
});
