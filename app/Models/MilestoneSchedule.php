<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MilestoneSchedule extends Model {
    protected $fillable = [
        'mahasiswa_id', 
        'academic_year_id',
        'milestone_type', 
        'date', 
        'time_start', 
        'time_end', 
        'room', 
        'status'
    ];

    public function mahasiswa() { return $this->belongsTo(User::class, 'mahasiswa_id'); }
    
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }

    // Relasi ke Pivot Assignees
    public function assignees() {
        return $this->hasMany(ScheduleAssignee::class)->with('dosen.dosenProfile.jabatanFungsional');
    }
}