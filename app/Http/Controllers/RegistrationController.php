<?php

namespace App\Http\Controllers;

use App\Models\MilestoneRegistration;
use App\Models\TaProject;
// use App\Models\Bimbingan; // Asumsi Anda punya model Bimbingan
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Cek data pendaftaran yang sudah ada
        $registrations = MilestoneRegistration::where('mahasiswa_id', $user->id)
            ->get()->keyBy('milestone_type');

        // Simulasi penghitungan dari database (Ganti dengan query riil ke tabel bimbingan Anda)
        // $bimbinganCountUtama = Bimbingan::where('mahasiswa_id', $user->id)->where('jenis_pembimbing', 'Utama')->count();
        $bimbinganCountUtama = 7; // Contoh Dummy (Syarat Seminar: 6, Sidang: 8)
        $bimbinganCountPendamping = 6; 

        return Inertia::render('pendaftaran', [
            'registrations' => $registrations,
            'stats' => [
                'bimbingan_utama' => $bimbinganCountUtama,
                'bimbingan_pendamping' => $bimbinganCountPendamping,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'milestone_type' => 'required|in:Sempro,Semhas,Sidang',
            'dokumen_kti_link' => 'required|url',
            'dokumen_produk_link' => 'required|url',
            'bukti_pembayaran_link' => 'nullable|url', // Wajib untuk Sidang
            'jumlah_kehadiran_seminar' => 'nullable|integer',
        ]);

        if ($validated['milestone_type'] === 'Sidang' && empty($validated['bukti_pembayaran_link'])) {
            return back()->withErrors(['bukti_pembayaran_link' => 'Bukti lunas pembayaran wajib dilampirkan untuk Sidang.']);
        }

        $validated['mahasiswa_id'] = $request->user()->id;
        $validated['status'] = 'pending_pembimbing';

        MilestoneRegistration::updateOrCreate(
            [
                'mahasiswa_id' => $request->user()->id,
                'milestone_type' => $validated['milestone_type']
            ],
            $validated
        );

        return redirect()->back()->with('success', 'Pendaftaran berhasil diajukan. Menunggu persetujuan Pembimbing.');
    }
}