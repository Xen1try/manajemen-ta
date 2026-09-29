<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\TaProject;
use App\Models\ProjectPembimbing;
use App\Models\DosenAvailability;
use App\Models\AcademicYear;
use Carbon\Carbon;

class ScheduleDemoSeeder extends Seeder
{
    public function run(): void
    {
        $besok = Carbon::tomorrow()->format('Y-m-d');

        // 1. Ambil Tahun Ajaran Aktif dari DatabaseSeeder utama
        $academicYear = AcademicYear::where('is_active', true)->first();
        if (!$academicYear) {
            $academicYear = AcademicYear::create(['name' => '2026/2027', 'semester' => 'Ganjil', 'is_active' => true]);
        }

        // 2. Ambil Akun Sesuai DatabaseSeeder Utama
        $mhs1 = User::where('email', 'arbiyan@polman-bandung.ac.id')->first();
        $dosen1 = User::where('email', 'harry@polman-bandung.ac.id')->first(); // Mohammad Harry Khomas Saputra
        $dosen2 = User::where('email', 'danu@polman-bandung.ac.id')->first(); // Danu Jaya Saputro

        if (!$mhs1 || !$dosen1 || !$dosen2) {
            $this->command->error('Akun utama (Arbiyan, Harry, atau Danu) belum ditemukan! Harap jalankan DatabaseSeeder utama terlebih dahulu.');
            return;
        }

        // 3. Ubah Status Akademik Arbiyan Menjadi Siap Sempro agar terdeteksi Engine
        if ($mhs1->mahasiswaProfile) {
            $mhs1->mahasiswaProfile->update(['academic_status' => 'ready_sempro']);
        }

        // 4. Buat Project TA dan Hubungkan Mahasiswa dengan Dosen Pembimbing (Harry)
        $project = TaProject::firstOrCreate(
            ['judul' => 'Sistem Penjadwalan Otomatis Berbasis Irisan Waktu (DEMO)'],
            [
                'academic_year_id' => $academicYear->id, 
                'tipe' => 'Tipe 1', 
                'kuota' => 1, 
                'pengusul_id' => $dosen1->id, 
                'status' => 'Assigned'
            ]
        );
        
        // Pastikan relasi mahasiswa ke project terhubung
        $project->mahasiswas()->syncWithoutDetaching([$mhs1->id]);

        // Jadikan Harry sebagai Pembimbing Utama
        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $project->id, 'dosen_id' => $dosen1->id], 
            ['role' => 'Utama', 'urutan' => 1]
        );

        // 5. Set Ketersediaan Waktu (Intersection) untuk Besok (Harry & Danu)
        // Menghapus ketersediaan lama di tanggal tersebut agar bersih
        DosenAvailability::whereIn('user_id', [$dosen1->id, $dosen2->id])
            ->where('date', $besok)
            ->delete();
        
        foreach ([$dosen1, $dosen2] as $dosen) {
            DosenAvailability::create([
                'user_id' => $dosen->id,
                'date' => $besok,
                'time_start' => null,
                'time_end' => null,
                'keterangan' => 'Tersedia seharian penuh (Suntikan Demo Sesuai DB Utama)'
            ]);
        }

        $this->command->info('Demo berhasil diselaraskan! Mahasiswa Arbiyan Saputra siap disidang/sempro dengan Pembimbing Harry Khomas dan Penguji Danu Jaya.');
    }
}