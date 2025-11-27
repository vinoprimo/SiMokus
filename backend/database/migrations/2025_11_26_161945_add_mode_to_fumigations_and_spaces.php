<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spaces', function (Blueprint $table) {
            $table->enum('mode', ['adm', 'activity'])->default('adm')->after('free_space');
        });

        Schema::table('fumigations', function (Blueprint $table) {
            $table->enum('mode', ['adm', 'activity'])->default('adm')->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('spaces', function (Blueprint $table) {
            $table->dropColumn('mode');
        });

        Schema::table('fumigations', function (Blueprint $table) {
            $table->dropColumn('mode');
        });
    }
};