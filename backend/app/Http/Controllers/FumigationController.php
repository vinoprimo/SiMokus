<?php

namespace App\Http\Controllers;

use App\Models\Fumigation;
use Illuminate\Http\Request;

class FumigationController extends Controller
{
    public function index()
    {
        return Fumigation::with('warehouse')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'date' => 'required|date',
            'type' => 'required|in:fumigasi,spraying',
            'notes' => 'nullable|string',
        ]);

        return Fumigation::create($request->all());
    }

    public function show(Fumigation $fumigation)
    {
        return $fumigation->load('warehouse');
    }

    public function update(Request $request, Fumigation $fumigation)
    {
        $request->validate([
            'date' => 'date',
            'type' => 'in:fumigasi,spraying',
            'notes' => 'nullable|string',
        ]);

        $fumigation->update($request->all());
        return $fumigation;
    }

    public function destroy(Fumigation $fumigation)
    {
        $fumigation->delete();
        return response()->noContent();
    }
}
