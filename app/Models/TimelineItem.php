<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimelineItem extends Model
{
    protected $fillable = ['timeline_id', 'name', 'system_code', 'start_date', 'end_date', 'order_index'];

    public function timeline() { return $this->belongsTo(Timeline::class); }
}