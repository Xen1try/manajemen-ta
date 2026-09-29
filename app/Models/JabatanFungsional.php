<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JabatanFungsional extends Model
{
    protected $fillable = [
        'name', 
        'weight_score',
        'max_kuota_bimbingan'
    ];
}
