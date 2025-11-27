<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Space extends Model
{
    use HasFactory;

    protected $fillable = ['warehouse_id', 'date', 'free_space', 'mode'];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}