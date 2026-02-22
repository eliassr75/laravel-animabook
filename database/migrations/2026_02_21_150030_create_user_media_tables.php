<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_media_status', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('media_type', 32);
            $table->unsignedBigInteger('mal_id');
            $table->string('status', 32)->nullable();
            $table->unsignedInteger('progress')->default(0);
            $table->decimal('user_score', 4, 1)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'media_type', 'mal_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('user_favorites', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('entity_type', 32);
            $table->unsignedBigInteger('mal_id');
            $table->timestamps();

            $table->unique(['user_id', 'entity_type', 'mal_id']);
        });

        Schema::create('user_votes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('scope', 64);
            $table->unsignedBigInteger('anime_mal_id');
            $table->smallInteger('value')->default(1);
            $table->timestamps();

            $table->unique(['user_id', 'scope']);
            $table->index(['user_id', 'scope']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_votes');
        Schema::dropIfExists('user_favorites');
        Schema::dropIfExists('user_media_status');
    }
};
