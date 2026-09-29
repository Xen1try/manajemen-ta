<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DosenAvailability extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'time_start',
        'time_end',
        'keterangan'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}