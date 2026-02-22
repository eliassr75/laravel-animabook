<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('media_type', 16);
            $table->unsignedBigInteger('mal_id');
            $table->decimal('score', 3, 1);
            $table->text('review');
            $table->boolean('is_spoiler')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'media_type', 'mal_id'], 'user_reviews_unique');
            $table->index(['media_type', 'mal_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_reviews');
    }
};
