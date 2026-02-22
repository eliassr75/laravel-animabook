<?php

namespace App\Integrations\Jikan\Endpoints;

use App\Integrations\Jikan\JikanHttpClient;

abstract class BaseEndpoint
{
    public function __construct(
        protected readonly JikanHttpClient $client,
    ) {
    }
}
