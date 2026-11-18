<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'user_id',
        'milestone_schedule_id',
        'seminar_title',
        'presenter_name',
        'milestone_type',
        'date',
        'location',
        'summary',
        'status',
        'verified_by',
        'verifier_notes',
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

    public function schedule()
    {
        return $this->belongsTo(MilestoneSchedule::class, 'milestone_schedule_id');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}