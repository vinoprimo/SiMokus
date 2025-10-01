<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WarehouseComplex;
use App\Models\Warehouse;

class WarehouseComplexSeeder extends Seeder
{
    public function run(): void
    {
        // Buat 2 kompleks gudang
        $complex1 = WarehouseComplex::create([
            'name' => 'Kompleks Gudang Utara',
            'location' => 'Jakarta Utara',
            'description' => 'Kompleks gudang untuk penyimpanan beras.',
        ]);

        $complex2 = WarehouseComplex::create([
            'name' => 'Kompleks Gudang Selatan',
            'location' => 'Jakarta Selatan',
            'description' => 'Kompleks gudang untuk penyimpanan jagung.',
        ]);

        // Tambahkan beberapa warehouse di masing-masing kompleks
        Warehouse::create([
            'name' => 'Gudang A1',
            'capacity' => 5000,
            'floorplan' => null,
            'warehouse_complex_id' => $complex1->id,
        ]);

        Warehouse::create([
            'name' => 'Gudang A2',
            'capacity' => 7000,
            'floorplan' => null,
            'warehouse_complex_id' => $complex1->id,
        ]);

        Warehouse::create([
            'name' => 'Gudang B1',
            'capacity' => 6000,
            'floorplan' => null,
            'warehouse_complex_id' => $complex2->id,
        ]);
    }
}
