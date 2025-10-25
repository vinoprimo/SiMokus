<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Fumigation extends Model
{
    use HasFactory;

    // tambahkan start_date dan end_date agar bisa diisi via create/update
    protected $fillable = ['warehouse_id', 'date', 'type', 'notes', 'start_date', 'end_date'];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}

