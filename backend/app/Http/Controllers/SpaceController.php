<?php

namespace App\Http\Controllers;

use App\Models\Space;
use Illuminate\Http\Request;

class SpaceController extends Controller
{
    public function index(Request $request)
    {
        $query = Space::with([
            'warehouse:id,warehouse_complex_id,name,capacity',
            'warehouse.complex:id,name'
        ]);

        // Filter by mode if provided
        if ($request->has('mode') && in_array($request->mode, ['adm', 'activity'])) {
            $query->where('mode', $request->mode);
        }

        return $query->orderByDesc('date')
            ->orderByDesc('id')
            ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'date' => 'required|date',
            'free_space' => 'required|integer|min:0',
            'mode' => 'required|in:adm,activity',
        ]);

        return Space::create($request->all());
    }

    public function show(Space $space)
    {
        return $space->load('warehouse');
    }

    public function update(Request $request, Space $space)
    {
        $request->validate([
            'free_space' => 'integer|min:0',
            'date' => 'date',
            'mode' => 'in:adm,activity',
        ]);

        $space->update($request->all());
        return $space;
    }

    public function destroy(Space $space)
    {
        $space->delete();
        return response()->noContent();
    }
}