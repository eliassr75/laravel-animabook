<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingest_cursors', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 120)->unique();
            $table->unsignedBigInteger('next_mal_id')->default(1);
            $table->unsignedBigInteger('last_valid_mal_id')->nullable();
            $table->unsignedInteger('consecutive_misses')->default(0);
            $table->boolean('is_active')->default(false);
            $table->timestamp('last_ran_at')->nullable();
            $table->text('last_error')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingest_cursors');
    }
};

