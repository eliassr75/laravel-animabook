<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntityRelation extends Model
{
    protected $table = 'entity_relations';

    protected $guarded = [];

    protected $casts = [
        'meta' => 'array',
    ];
}
