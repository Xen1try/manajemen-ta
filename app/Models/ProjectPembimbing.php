<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPembimbing extends Model
{
    protected $fillable = [
        'ta_project_id', 
        'dosen_id', 
        'role', 
        'urutan'
    ];

    public function project() { return $this->belongsTo(TaProject::class, 'ta_project_id'); }
    public function dosen() { return $this->belongsTo(User::class, 'dosen_id'); }
}