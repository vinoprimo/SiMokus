<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index()
    {
        return Warehouse::with(['spaces', 'fumigations'])->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'capacity' => 'required|integer',
        ]);

        return Warehouse::create($request->all());
    }

    public function show(Warehouse $warehouse)
    {
        return $warehouse->load(['spaces', 'fumigations']);
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

