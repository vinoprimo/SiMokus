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
        $validated = $request->validate([
            'warehouse_complex_id' => 'required|exists:warehouse_complexes,id',
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer',
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json($warehouse->load(['complex']), 201);
    }

    public function show(Warehouse $warehouse)
    {
        return $warehouse->load(['complex', 'spaces', 'fumigations']);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'warehouse_complex_id' => 'required|exists:warehouse_complexes,id',
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer',
        ]);

        $warehouse->update($validated);

        return response()->json($warehouse->load(['complex']));
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();
        return response()->json(['message' => 'Warehouse deleted successfully']);
    }
}
