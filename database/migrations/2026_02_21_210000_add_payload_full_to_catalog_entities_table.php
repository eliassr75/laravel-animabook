<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_entities', function (Blueprint $table) {
            $table->json('payload_full')->nullable()->after('payload');
        });
    }

    public function down(): void
    {
        Schema::table('catalog_entities', function (Blueprint $table) {
            $table->dropColumn('payload_full');
        });
    }
};
