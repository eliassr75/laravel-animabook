<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entity_relations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('from_type', 32);
            $table->unsignedBigInteger('from_mal_id');
            $table->string('to_type', 32);
            $table->unsignedBigInteger('to_mal_id');
            $table->string('relation_type', 64);
            $table->unsignedInteger('weight')->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['from_type', 'from_mal_id', 'relation_type']);
            $table->index(['to_type', 'to_mal_id', 'relation_type']);
            $table->unique(['from_type', 'from_mal_id', 'to_type', 'to_mal_id', 'relation_type'], 'entity_relations_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_relations');
    }
};
