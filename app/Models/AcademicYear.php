<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = ['name', 'semester', 'is_active'];

    protected function casts(): array {
        return ['is_active' => 'boolean'];
    }

    public function timelines() { return $this->hasMany(Timeline::class); }
}