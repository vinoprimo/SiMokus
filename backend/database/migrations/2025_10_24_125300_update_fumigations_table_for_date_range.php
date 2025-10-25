<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('fumigations', function (Blueprint $table) {
        $table->date('start_date')->nullable()->after('warehouse_id');
        $table->date('end_date')->nullable()->after('start_date');
        $table->date('date')->nullable()->change(); // ubah date jadi nullable
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
