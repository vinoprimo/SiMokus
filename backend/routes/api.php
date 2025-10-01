<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    // ---------- WAREHOUSE ----------
    Route::apiResource('warehouses', WarehouseController::class);

    // ---------- FUMIGATION / QUALITY ----------
    Route::apiResource('fumigations', FumigationController::class);

    // ---------- SPACE / CAPACITY ----------
    Route::apiResource('spaces', SpaceController::class);
});
