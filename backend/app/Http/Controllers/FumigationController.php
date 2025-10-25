<?php

namespace App\Http\Controllers;

use App\Models\Fumigation;
use Illuminate\Http\Request;

class FumigationController extends Controller
{
    public function index()
    {
        // include kompleks agar tabel FE bisa menampilkan nama kompleks
        return Fumigation::with([
            'warehouse:id,name,warehouse_complex_id',
            'warehouse.complex:id,name'
        ])
        ->orderByDesc('id')
        ->get();
    }

    public function store(Request $request)
{
    $request->validate([
        'warehouse_id' => 'required|exists:warehouses,id',
        'type' => 'required|in:fumigasi,spraying',
        'date' => 'nullable|date',
        'start_date' => 'nullable|date',
        'end_date' => 'nullable|date|after_or_equal:start_date',
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
        'type' => 'in:fumigasi,spraying',
        'date' => 'nullable|date',
        'start_date' => 'nullable|date',
        'end_date' => 'nullable|date|after_or_equal:start_date',
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

    public function active()
{
    $today = now();

    $activeFumigations = \App\Models\Fumigation::with('warehouse')
        ->where(function ($q) use ($today) {
            $q->where('type', 'fumigasi')
              ->whereDate('start_date', '<=', $today)
              ->whereDate('end_date', '>=', $today);
        })
        ->orWhere(function ($q) use ($today) {
            $q->where('type', 'spraying')
              ->whereDate('date', $today);
        })
        ->get();

    return response()->json($activeFumigations);
}



}

