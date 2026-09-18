<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DosenBlock extends Model
{
    protected $fillable = [
        'user_id', 
        'date', 
        'time_start', 
        'time_end',
        'reason'
    ];

    public function user() { return $this->belongsTo(User::class); }
}