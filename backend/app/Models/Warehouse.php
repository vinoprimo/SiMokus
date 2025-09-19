<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'location', 'capacity', 'floorplan'];

    public function spaces()
    {
        return $this->hasMany(Space::class);
    }

    public function fumigations()
    {
        return $this->hasMany(Fumigation::class);
    }
}

