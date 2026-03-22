<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metric_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('metric_key', 120)->unique();
            $table->json('payload');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('refresh_after')->nullable();
            $table->timestamps();

            $table->index('refresh_after');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metric_snapshots');
    }
};
