<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MahasiswaProfile extends Model {

    protected $fillable = [
        'user_id', 
        'nim', 
        'prodi_id', 
        'academic_year_id',
        'angkatan', 
        'skill_vector', 
        'academic_status'
    ];
    
    protected function casts(): array {
        return [
            'skill_vector' => 'array',
        ];
    }

    public function prodi() { return $this->belongsTo(Prodi::class); }
    
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
}