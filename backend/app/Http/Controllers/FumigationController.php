<?php
// filepath: backend/app/Http/Controllers/FumigationController.php

namespace App\Http\Controllers;

use App\Models\Fumigation;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FumigationController extends Controller
{
    public function index(Request $request)
    {
        $query = Fumigation::with([
            'warehouse:id,name,warehouse_complex_id',
            'warehouse.complex:id,name'
        ]);

        // Filter by mode if provided
        if ($request->has('mode') && in_array($request->mode, ['adm', 'activity'])) {
            $query->where('mode', $request->mode);
        }

        return $query->orderByDesc('id')->get();
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
            'mode' => 'required|in:adm,activity',
        ]);

        // CHECK FOR OVERLAPPING SCHEDULES
        $warehouseId = $request->warehouse_id;
        $type = $request->type;
        $mode = $request->mode;

        if ($type === 'fumigasi') {
            // Check fumigasi overlap (date range)
            $startDate = $request->start_date;
            $endDate = $request->end_date;

            $overlap = Fumigation::where('warehouse_id', $warehouseId)
                ->where('type', 'fumigasi')
                ->where('mode', $mode)
                ->where(function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function ($q) use ($startDate, $endDate) {
                            $q->where('start_date', '<=', $startDate)
                              ->where('end_date', '>=', $endDate);
                        });
                })
                ->exists();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'start_date' => 'Jadwal fumigasi untuk gudang ini sudah ada pada rentang tanggal tersebut.'
                ]);
            }
        } else {
            // Check spraying overlap (single date)
            $date = $request->date;

            $overlap = Fumigation::where('warehouse_id', $warehouseId)
                ->where('type', 'spraying')
                ->where('mode', $mode)
                ->where('date', $date)
                ->exists();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'date' => 'Jadwal spraying untuk gudang ini sudah ada pada tanggal tersebut.'
                ]);
            }
        }

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
            'mode' => 'in:adm,activity',
        ]);

        // CHECK FOR OVERLAPPING SCHEDULES (exclude current record)
        if ($request->has('warehouse_id') || $request->has('start_date') || $request->has('end_date') || $request->has('date')) {
            $warehouseId = $request->warehouse_id ?? $fumigation->warehouse_id;
            $type = $request->type ?? $fumigation->type;
            $mode = $request->mode ?? $fumigation->mode;

            if ($type === 'fumigasi') {
                $startDate = $request->start_date ?? $fumigation->start_date;
                $endDate = $request->end_date ?? $fumigation->end_date;

                $overlap = Fumigation::where('warehouse_id', $warehouseId)
                    ->where('type', 'fumigasi')
                    ->where('mode', $mode)
                    ->where('id', '!=', $fumigation->id)
                    ->where(function ($query) use ($startDate, $endDate) {
                        $query->whereBetween('start_date', [$startDate, $endDate])
                            ->orWhereBetween('end_date', [$startDate, $endDate])
                            ->orWhere(function ($q) use ($startDate, $endDate) {
                                $q->where('start_date', '<=', $startDate)
                                  ->where('end_date', '>=', $endDate);
                            });
                    })
                    ->exists();

                if ($overlap) {
                    throw ValidationException::withMessages([
                        'start_date' => 'Jadwal fumigasi untuk gudang ini sudah ada pada rentang tanggal tersebut.'
                    ]);
                }
            } else {
                $date = $request->date ?? $fumigation->date;

                $overlap = Fumigation::where('warehouse_id', $warehouseId)
                    ->where('type', 'spraying')
                    ->where('mode', $mode)
                    ->where('id', '!=', $fumigation->id)
                    ->where('date', $date)
                    ->exists();

                if ($overlap) {
                    throw ValidationException::withMessages([
                        'date' => 'Jadwal spraying untuk gudang ini sudah ada pada tanggal tersebut.'
                    ]);
                }
            }
        }

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

        $activeFumigations = Fumigation::with('warehouse')
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