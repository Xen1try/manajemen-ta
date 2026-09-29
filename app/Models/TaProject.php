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
        'kuota', 
        'pengusul_id', 
        'status'
    ];

    protected function casts(): array {
        return ['required_skills' => 'array'];
    }

    public function pengusul() {
        return $this->belongsTo(User::class, 'pengusul_id');
    }

    // RELASI BARU: Mendukung banyak mahasiswa per project
    public function mahasiswas() {
        return $this->belongsToMany(User::class, 'project_mahasiswas', 'ta_project_id', 'mahasiswa_id');
    }

    public function pembimbings() {
        return $this->hasMany(ProjectPembimbing::class);
    }
}