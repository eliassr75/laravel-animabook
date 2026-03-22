<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetricSnapshot extends Model
{
    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
        'generated_at' => 'immutable_datetime',
        'refresh_after' => 'immutable_datetime',
    ];
}
