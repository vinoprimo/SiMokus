<?php

namespace App\Http\Controllers;

use App\Models\WarehouseComplex;
use Illuminate\Http\Request;

class WarehouseComplexController extends Controller
{
    public function index(Request $request)
{
    $query = WarehouseComplex::query();

    if ($request->has('with')) {
        $relations = explode(',', $request->get('with'));
        $query->with($relations);
    }

    return $query->get();
}



    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'location' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        return WarehouseComplex::create($request->all());
    }

    public function show(WarehouseComplex $warehouseComplex)
    {
        return $warehouseComplex->load('warehouses');
    }

    public function update(Request $request, WarehouseComplex $warehouseComplex)
    {
        $warehouseComplex->update($request->all());
        return $warehouseComplex;
    }

    public function destroy(WarehouseComplex $warehouseComplex)
    {
        $warehouseComplex->delete();
        return response()->noContent();
    }
}
