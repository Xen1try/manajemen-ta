<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemaSelection extends Model
{
    protected $fillable = [
        'academic_year_id', 
        'mahasiswa_id', 
        'pilihan_1_id', 
        'pilihan_2_id', 
        'pilihan_3_id', 
        'locked_at', 
        'status'
    ];

    protected function casts(): array {
        return ['locked_at' => 'datetime'];
    }

    public function mahasiswa() { return $this->belongsTo(User::class, 'mahasiswa_id'); }
    public function pilihan1() { return $this->belongsTo(TaProject::class, 'pilihan_1_id'); }
    public function pilihan2() { return $this->belongsTo(TaProject::class, 'pilihan_2_id'); }
    public function pilihan3() { return $this->belongsTo(TaProject::class, 'pilihan_3_id'); }
}