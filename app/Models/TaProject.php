<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaProject extends Model
{
    protected $fillable = [
        'academic_year_id', 
        'tipe', 
        'judul', 
        'deskripsi', 
        'required_skills', 
        'pengusul_id', 
        'mahasiswa_id', 
        'status'
    ];

    protected function casts(): array {
        return ['required_skills' => 'array'];
    }

    public function pengusul() { return $this->belongsTo(User::class, 'pengusul_id'); }
    public function mahasiswa() { return $this->belongsTo(User::class, 'mahasiswa_id'); }
    public function pembimbings() { return $this->hasMany(ProjectPembimbing::class)->orderBy('urutan'); }
    public function academicYear() { return $this->belongsTo(AcademicYear::class); }
}