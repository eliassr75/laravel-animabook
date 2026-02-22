<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingest_budgets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('bucket', 64);
            $table->date('day');
            $table->unsignedInteger('limit')->default(10000);
            $table->unsignedInteger('used')->default(0);
            $table->timestamps();

            $table->unique(['bucket', 'day']);
        });

        Schema::create('ingest_leases', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('entity_type', 32);
            $table->unsignedBigInteger('mal_id');
            $table->timestamp('lease_expires_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->string('locked_by')->nullable();
            $table->timestamps();

            $table->unique(['entity_type', 'mal_id']);
            $table->index(['lease_expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingest_leases');
        Schema::dropIfExists('ingest_budgets');
    }
};
