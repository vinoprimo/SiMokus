<?php

namespace App\Http\Controllers;

use App\Models\WarehouseComplex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WarehouseComplexController extends Controller
{
    public function index(Request $request)
    {
        $query = WarehouseComplex::query();

        if ($request->has('with')) {
            $relations = array_filter(array_map('trim', explode(',', $request->get('with'))));
            $query->with($relations);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string',
            'location'     => 'nullable|string',
            'description'  => 'nullable|string',
            'layout_image' => 'nullable|image|max:4096',
        ]);

        $path = null;

        return DB::transaction(function () use ($request, $validated, &$path) {
            if ($request->hasFile('layout_image')) {
                $path = $request->file('layout_image')->store('denah', 'public');
            }

            $complex = WarehouseComplex::create([
                'name'         => $validated['name'],
                'location'     => $validated['location'] ?? null,
                'description'  => $validated['description'] ?? null,
                'layout_image' => $path,
            ]);

            return response()->json($complex->fresh(), 201);
        });
    }

    public function show(WarehouseComplex $warehouseComplex)
    {
        return $warehouseComplex->load('warehouses');
    }

    public function update(Request $request, WarehouseComplex $warehouseComplex)
    {
        $validated = $request->validate([
            'name'         => 'sometimes|required|string',
            'location'     => 'nullable|string',
            'description'  => 'nullable|string',
            'layout_image' => 'nullable|image|max:4096',
        ]);

        return DB::transaction(function () use ($request, $warehouseComplex, $validated) {
            // Update field teks
            $warehouseComplex->fill([
                'name'        => $validated['name']        ?? $warehouseComplex->name,
                'location'    => $validated['location']    ?? $warehouseComplex->location,
                'description' => $validated['description'] ?? $warehouseComplex->description,
            ]);

            // Ganti file denah bila ada upload baru
            if ($request->hasFile('layout_image')) {
                if ($warehouseComplex->layout_image) {
                    Storage::disk('public')->delete($warehouseComplex->layout_image);
                }
                $warehouseComplex->layout_image = $request->file('layout_image')->store('denah', 'public');
            }

            $warehouseComplex->save();

            return $warehouseComplex->fresh();
        });
    }

    public function destroy(WarehouseComplex $warehouseComplex)
    {
        if ($warehouseComplex->layout_image) {
            Storage::disk('public')->delete($warehouseComplex->layout_image);
        }

        $warehouseComplex->delete();
        return response()->noContent();
    }
}