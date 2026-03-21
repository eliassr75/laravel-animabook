<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JikanCache extends Model
{
    protected $table = 'jikan_cache';

    protected $guarded = [];

    protected $casts = [
        'query_json' => 'array',
        'fetched_at' => 'immutable_datetime',
        'expires_at' => 'immutable_datetime',
    ];
}
