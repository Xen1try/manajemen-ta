<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Timeline extends Model
{
    protected $fillable = ['academic_year_id', 'name', 'is_locked'];

    protected function casts(): array {
        return ['is_locked' => 'boolean'];
    }

    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
    public function items() { return $this->hasMany(TimelineItem::class)->orderBy('order_index'); }
}