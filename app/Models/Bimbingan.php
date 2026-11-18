<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bimbingan extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'ta_project_id',
        'user_id',
        'lecturer_id',
        'lecturer_name',
        'pembimbing_ke',
        'date',
        'topic',
        'notes',
        'next_action',
        'status',
        'lecturer_feedback',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function lecturer()
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    public function taProject()
    {
        return $this->belongsTo(TaProject::class, 'ta_project_id');
    }
}