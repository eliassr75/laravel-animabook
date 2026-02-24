<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IngestCursor extends Model
{
    protected $table = 'ingest_cursors';

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'last_ran_at' => 'datetime',
        'meta' => 'array',
    ];
}

