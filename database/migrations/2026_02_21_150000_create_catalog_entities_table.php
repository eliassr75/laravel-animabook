<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_entities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('entity_type', 32);
            $table->unsignedBigInteger('mal_id');

            $table->string('title');
            $table->string('title_normalized')->nullable();
            $table->text('synopsis_short')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->string('season', 16)->nullable();
            $table->string('status', 32)->nullable();
            $table->string('rating', 32)->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->unsignedInteger('rank')->nullable();
            $table->unsignedInteger('popularity')->nullable();
            $table->unsignedInteger('members')->nullable();
            $table->unsignedInteger('favorites')->nullable();

            $table->json('images')->nullable();
            $table->json('trailer')->nullable();
            $table->json('external_links')->nullable();
            $table->json('payload');

            $table->timestamp('last_fetched_at')->nullable();
            $table->timestamp('next_refresh_at')->nullable();
            $table->unsignedInteger('fetch_failures')->default(0);
            $table->text('last_error')->nullable();

            $table->timestamps();

            $table->unique(['entity_type', 'mal_id']);
            $table->index(['entity_type', 'score']);
            $table->index(['entity_type', 'rank']);
            $table->index(['entity_type', 'popularity']);
            $table->index(['entity_type', 'year', 'season']);
            $table->index(['entity_type', 'status']);
            $table->index(['title_normalized']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            Schema::table('catalog_entities', function (Blueprint $table) {
                $table->fullText(['title', 'synopsis_short']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_entities');
    }
};
