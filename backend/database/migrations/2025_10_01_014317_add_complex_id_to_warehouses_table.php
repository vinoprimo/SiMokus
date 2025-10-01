<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            // tambahkan relasi ke warehouse_complexes
            $table->foreignId('warehouse_complex_id')
                  ->after('id')
                  ->constrained('warehouse_complexes')
                  ->cascadeOnDelete();

            // kalau kolom location sudah ada di warehouses, hapus
            if (Schema::hasColumn('warehouses', 'location')) {
                $table->dropColumn('location');
            }
        });
    }

    public function down(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropForeign(['warehouse_complex_id']);
            $table->dropColumn('warehouse_complex_id');
            $table->string('location')->nullable();
        });
    }
};
