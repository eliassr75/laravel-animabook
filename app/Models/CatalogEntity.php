<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CatalogEntity extends Model
{
    protected $table = 'catalog_entities';

    protected $guarded = [];

    protected $casts = [
        'images' => 'array',
        'trailer' => 'array',
        'external_links' => 'array',
        'payload' => 'array',
        'payload_full' => 'array',
        'last_fetched_at' => 'datetime',
        'next_refresh_at' => 'datetime',
    ];

    public function imageUrl(): ?string
    {
        $candidates = [
            data_get($this->payload, 'images.jpg.image_url'),
            data_get($this->payload, 'images.webp.image_url'),
            data_get($this->payload, 'images.jpg.large_image_url'),
            data_get($this->payload, 'images.webp.large_image_url'),
            data_get($this->images, 'jpg.image_url'),
            data_get($this->images, 'webp.image_url'),
            data_get($this->images, 'jpg.large_image_url'),
            data_get($this->images, 'webp.large_image_url'),
        ];

        foreach ($candidates as $url) {
            if (is_string($url) && $url !== '') {
                return $url;
            }
        }

        return null;
    }

    public function scopeType(Builder $query, string $type): Builder
    {
        return $query->where('entity_type', $type);
    }
}
