<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = ['warehouse_complex_id', 'name', 'capacity', 'floorplan'];

    public function complex()
    {
        return $this->belongsTo(WarehouseComplex::class, 'warehouse_complex_id');
    }

    public function spaces()
    {
        return $this->hasMany(Space::class);
    }

    public function fumigations()
    {
        return $this->hasMany(Fumigation::class);
    }
}
