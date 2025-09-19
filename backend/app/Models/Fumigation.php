<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fumigation extends Model
{
    use HasFactory;

    protected $fillable = ['warehouse_id', 'date', 'type', 'notes'];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}

