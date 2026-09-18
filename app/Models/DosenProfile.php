<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DosenProfile extends Model {

    protected $fillable = [
        'user_id', 
        'nip', 
        'prodi_id', 
        'jabatan_fungsional_id', 
        'weight_score', 
        'skill_vector', 
        'max_kuota_bimbingan'
    ];

    protected function casts(): array {
        return ['skill_vector' => 'array'];
    }
    
    public function prodi() { return $this->belongsTo(Prodi::class); }
    public function jabatanFungsional() { return $this->belongsTo(JabatanFungsional::class); }
}