<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoSetting extends Model
{
    protected $table = 'seo_settings';

    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
    ];
}
