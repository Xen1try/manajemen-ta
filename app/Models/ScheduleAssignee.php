<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleAssignee extends Model {
    protected $fillable = [
        'milestone_schedule_id', 
        'user_id', 
        'role_type'
    ];

    public function schedule() { return $this->belongsTo(MilestoneSchedule::class, 'milestone_schedule_id'); }
    public function dosen() { return $this->belongsTo(User::class, 'user_id'); } // Dosen yang ditugaskan
}