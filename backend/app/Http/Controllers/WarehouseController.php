<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index()
    {
        return Warehouse::with(['complex', 'spaces', 'fumigations'])->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_complex_id' => 'required|exists:warehouse_complexes,id',
            'name' => 'required',
            'capacity' => 'required|integer',
        ]);

        return Warehouse::create($request->all());
    }

    public function show(Warehouse $warehouse)
    {
        return $warehouse->load(['complex', 'spaces', 'fumigations']);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $warehouse->update($request->all());
        return $warehouse;
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();
        return response()->noContent();
    }
}
