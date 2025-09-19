<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Space extends Model
{
    use HasFactory;

    protected $fillable = ['warehouse_id', 'date', 'free_space'];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}

