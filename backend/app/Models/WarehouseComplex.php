<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage; // <-- tambahkan ini

class WarehouseComplex extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'location', 'description', 'layout_image'];
    protected $appends = ['layout_image_url'];

    public function getLayoutImageUrlAttribute(): ?string
    {
        return $this->layout_image ? Storage::url($this->layout_image) : null;
    }

    public function warehouses()
    {
        return $this->hasMany(Warehouse::class);
    }
}
