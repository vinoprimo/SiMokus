<?php

use App\Http\Controllers\WarehouseComplexController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\FumigationController;
use App\Http\Controllers\SpaceController;

Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // ---------- WAREHOUSE COMPLEX ----------
    Route::apiResource('warehouse-complexes', WarehouseComplexController::class);

    // ---------- WAREHOUSE ----------
    Route::apiResource('warehouses', WarehouseController::class);

    // ---------- FUMIGATION / QUALITY ----------
    Route::apiResource('fumigations', FumigationController::class);

    // ---------- SPACE / CAPACITY ----------
    Route::apiResource('spaces', SpaceController::class);
});

