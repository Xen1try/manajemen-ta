<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MilestoneRegistration extends Model
{
    protected $fillable = [
        'mahasiswa_id', 'milestone_type', 'dokumen_kti_link', 
        'dokumen_produk_link', 'bukti_pembayaran_link', 
        'jumlah_kehadiran_seminar', 'status', 'catatan_penolakan'
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(User::class, 'mahasiswa_id');
    }
}