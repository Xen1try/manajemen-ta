<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bimbingan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'lecturer_name',
        'topic',
        'notes',
        'next_action',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}