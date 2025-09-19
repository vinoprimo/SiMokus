<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\SpaceController;
use App\Http\Controllers\FumigationController;
use App\Http\Controllers\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('warehouses', WarehouseController::class);
    Route::apiResource('spaces', SpaceController::class);
    Route::apiResource('fumigations', FumigationController::class);
});


