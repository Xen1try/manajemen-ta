<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TugasAkhirController extends Controller
{
    /**
     * Halaman Ruang Bimbingan
     */
    public function bimbingan(Request $request)
    {
        $sessions = [
            ['date' => '11 JUN', 'title' => 'Review progres implementasi', 'note' => 'Revisi modul akuisisi data dan tambahkan pengujian reliabilitas.', 'person' => 'Ir. Budi Santoso', 'status' => 'Terjadwal', 'tone' => 'blue'],
            ['date' => '04 JUN', 'title' => 'Validasi metodologi penelitian', 'note' => 'Metode eksperimen disetujui dengan beberapa catatan minor.', 'person' => 'Ir. Budi Santoso', 'status' => 'Selesai', 'tone' => 'green'],
            ['date' => '28 MEI', 'title' => 'Diskusi rancangan sistem', 'note' => 'Membahas rancangan arsitektur dan pembagian modul.', 'person' => 'Ir. Budi Santoso', 'status' => 'Selesai', 'tone' => 'green']
        ];

        return Inertia::render('Bimbingan', [
            // Nantinya 'role' ini bisa diambil dari auth()->user()->role
            'role' => 'Mahasiswa', 
            'sessions' => $sessions
        ]);
    }

    /**
     * Halaman Arsip Dokumen
     */
    public function dokumen(Request $request)
    {
        $docs = [
            ['name' => 'Proposal Tugas Akhir', 'type' => 'PDF · 2.4 MB', 'status' => 'Disetujui', 'tone' => 'green'],
            ['name' => 'Laporan Bab 1–3', 'type' => 'PDF · 5.8 MB', 'status' => 'Disetujui', 'tone' => 'green'],
            ['name' => 'Laporan Bab 4–5', 'type' => 'PDF · 3.1 MB', 'status' => 'Perlu revisi', 'tone' => 'red'],
            ['name' => 'Surat Pernyataan Orisinalitas', 'type' => 'PDF · Belum diunggah', 'status' => 'Menunggu', 'tone' => 'amber']
        ];

        return Inertia::render('Dokumen', [
            'role' => 'Mahasiswa',
            'docs' => $docs
        ]);
    }

    /**
     * Halaman Jadwal & Sidang
     */
    public function jadwal(Request $request)
    {
        $schedules = [
            ['day' => '18', 'month' => 'JUN', 'title' => 'Sidang Tugas Akhir', 'time' => '09.00 – 10.30 WIB', 'room' => 'Ruang Sidang 1', 'student' => 'Maulana Rizky'],
            ['day' => '19', 'month' => 'JUN', 'title' => 'Seminar Proposal', 'time' => '13.00 – 14.00 WIB', 'room' => 'Lab Presentasi', 'student' => 'Dhea Anindita'],
            ['day' => '20', 'month' => 'JUN', 'title' => 'Sidang Tugas Akhir', 'time' => '10.00 – 11.30 WIB', 'room' => 'Ruang Sidang 2', 'student' => 'Nadia Putri']
        ];

        $lecturerAvailability = [
            ['name' => 'Ir. Budi Santoso', 'role' => 'Pembimbing · 12 mahasiswa', 'slots' => ['18 Jun · 09.00–12.00', '19 Jun · 13.00–16.00', '20 Jun · 09.00–12.00'], 'status' => 'Lengkap'],
            ['name' => 'Dr. Arif Rahman', 'role' => 'Penguji · 8 mahasiswa', 'slots' => ['18 Jun · 09.00–12.00', '20 Jun · 13.00–16.00'], 'status' => 'Lengkap'],
            ['name' => 'Dr. Sari Wulandari', 'role' => 'Penguji · 6 mahasiswa', 'slots' => ['19 Jun · 09.00–12.00'], 'status' => 'Perlu isi']
        ];

        $generatedSchedule = [
            ['time' => '18 Jun · 09.00–10.30', 'room' => 'Ruang Sidang 1', 'student' => 'Maulana Rizky', 'supervisor' => 'Ir. Budi Santoso', 'examiner' => 'Dr. Arif Rahman', 'match' => '2/2 dosen tersedia'],
            ['time' => '19 Jun · 13.00–14.30', 'room' => 'Ruang Sidang 2', 'student' => 'Dhea Anindita', 'supervisor' => 'Ir. Budi Santoso', 'examiner' => 'Dr. Sari Wulandari', 'match' => '2/2 dosen tersedia'],
            ['time' => '20 Jun · 09.00–10.30', 'room' => 'Ruang Sidang 1', 'student' => 'Nadia Putri', 'supervisor' => 'Ir. Budi Santoso', 'examiner' => 'Dr. Arif Rahman', 'match' => '2/2 dosen tersedia']
        ];

        return Inertia::render('Jadwal', [
            'role' => 'Mahasiswa',
            'schedules' => $schedules,
            'lecturerAvailability' => $lecturerAvailability,
            'generatedSchedule' => $generatedSchedule
        ]);
    }
}