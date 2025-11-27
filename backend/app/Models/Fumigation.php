<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Fumigation extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id', 
        'date', 
        'type', 
        'notes', 
        'start_date', 
        'end_date',
        'mode'
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}