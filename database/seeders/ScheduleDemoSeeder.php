<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Bimbingan;
use App\Models\DosenAvailability;
use App\Models\MilestoneRegistration;
use App\Models\ProjectPembimbing;
use App\Models\SeminarAttendance;
use App\Models\TaDocument;
use App\Models\TaProject;
use App\Models\TemaSelection;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ScheduleDemoSeeder extends Seeder
{
    public function run(): void
    {
        $besok = Carbon::tomorrow()->format('Y-m-d');
        $lusa = Carbon::tomorrow()->addDay()->format('Y-m-d');

        $academicYear = AcademicYear::where('is_active', true)->first();
        if (! $academicYear) {
            $academicYear = AcademicYear::create([
                'name' => '2026/2027',
                'semester' => 'Ganjil',
                'is_active' => true,
            ]);
        }

        $dosen1 = User::where('email', 'harry@polman-bandung.ac.id')->first();
        $dosen2 = User::where('email', 'danu@polman-bandung.ac.id')->first();
        $dosen3 = User::where('email', 'budi@polman-bandung.ac.id')->first();

        $mhs1 = User::where('email', 'arbiyan@polman-bandung.ac.id')->first();
        $mhs2 = User::where('email', 'aqila@polman-bandung.ac.id')->first();
        $mhs3 = User::where('email', 'zahra@polman-bandung.ac.id')->first();

        if (! $mhs1 || ! $mhs2 || ! $mhs3 || ! $dosen1 || ! $dosen2 || ! $dosen3) {
            $this->command->error('Akun utama belum ditemukan! Harap jalankan DatabaseSeeder terlebih dahulu.');
            return;
        }

        $teamId = $mhs1->current_team_id;

        // =========================================================================
        // 1. SKENARIO ARBIYAN (Siap Sidang & Siap Dijadwalkan Otomatis)
        // =========================================================================
        $projectArbiyan = TaProject::firstOrCreate(
            ['judul' => 'Sistem Manajemen Tugas Akhir Terintegrasi Berbasis Vector Matchmaking'],
            [
                'academic_year_id' => $academicYear->id,
                'tipe' => 'Tipe 1',
                'deskripsi' => 'Platform pengelolaan Tugas Akhir Politeknik Manufaktur Bandung dengan RBAC dinamis, vector matchmaking, dan penjadwalan otomatis.',
                'kuota' => 1,
                'pengusul_id' => $dosen1->id,
                'status' => 'Assigned',
            ]
        );
        $projectArbiyan->mahasiswas()->syncWithoutDetaching([$mhs1->id]);

        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $projectArbiyan->id, 'dosen_id' => $dosen1->id],
            ['role' => 'Utama', 'urutan' => 1]
        );
        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $projectArbiyan->id, 'dosen_id' => $dosen2->id],
            ['role' => 'Pendamping', 'urutan' => 2]
        );

        // Logbook Bimbingan Tervalidasi (8x Pembimbing 1 & 8x Pembimbing 2)
        if (Bimbingan::where('user_id', $mhs1->id)->count() === 0) {
            for ($i = 1; $i <= 8; $i++) {
                Bimbingan::create([
                    'team_id' => $teamId,
                    'ta_project_id' => $projectArbiyan->id,
                    'user_id' => $mhs1->id,
                    'lecturer_id' => $dosen1->id,
                    'lecturer_name' => $dosen1->name,
                    'pembimbing_ke' => 1,
                    'date' => Carbon::today()->subDays(40 - ($i * 4))->toDateString(),
                    'topic' => "Bimbingan Utama Tahap #{$i}: Arsitektur & Algoritma Sistem",
                    'notes' => 'Diskusi penyempurnaan rancangan basis data dan logika validasi.',
                    'next_action' => 'Lanjutkan pengujian integrasi modul.',
                    'status' => 'approved',
                    'lecturer_feedback' => 'Progres baik, lanjutkan ke tahap berikutnya.',
                    'verified_at' => now()->subDays(39 - ($i * 4)),
                ]);

                Bimbingan::create([
                    'team_id' => $teamId,
                    'ta_project_id' => $projectArbiyan->id,
                    'user_id' => $mhs1->id,
                    'lecturer_id' => $dosen2->id,
                    'lecturer_name' => $dosen2->name,
                    'pembimbing_ke' => 2,
                    'date' => Carbon::today()->subDays(38 - ($i * 4))->toDateString(),
                    'topic' => "Bimbingan Pendamping Tahap #{$i}: Tata Tulis & Pengujian KTI",
                    'notes' => 'Review struktur Bab 1-5 sesuai pedoman KTI Polman Bandung.',
                    'next_action' => 'Perbaiki sitasi dan lampiran pengujian.',
                    'status' => 'approved',
                    'lecturer_feedback' => 'Sudah sesuai format penulisan.',
                    'verified_at' => now()->subDays(37 - ($i * 4)),
                ]);
            }
        }

        // Kehadiran Seminar Terverifikasi (5x Audiens agar lolos syarat Sidang)
        if (SeminarAttendance::where('user_id', $mhs1->id)->count() === 0) {
            for ($i = 1; $i <= 5; $i++) {
                SeminarAttendance::create([
                    'team_id' => $teamId,
                    'user_id' => $mhs1->id,
                    'seminar_title' => "Seminar Tugas Akhir Topik Otomasi Industri #{$i}",
                    'presenter_name' => "Mahasiswa Angkatan 2022 #{$i}",
                    'milestone_type' => $i <= 3 ? 'Sempro' : 'Semhas',
                    'date' => Carbon::today()->subDays(25 - ($i * 3))->toDateString(),
                    'location' => 'Ruang Sidang 1 (Gedung Direktorat)',
                    'summary' => 'Menyimak metodologi penelitian, arsitektur sistem, serta sesi tanya jawab penguji.',
                    'status' => 'approved',
                    'verified_by' => $dosen1->id,
                    'verified_at' => now(),
                ]);
            }
        }

        // Dokumen TA & Sertifikat iThenticate (Skor 14.00% <= 25.00%)
        $demoDocs = [
            [
                'category' => 'proposal',
                'title' => 'Proposal Tugas Akhir - Arbiyan Saputra',
                'file_path' => 'documents/demo-proposal-arbiyan.pdf',
                'file_name' => 'Proposal_TA_Arbiyan_Saputra.pdf',
                'file_size' => '1.8 MB',
                'similarity_score' => null,
            ],
            [
                'category' => 'laporan_semhas',
                'title' => 'Laporan Seminar Hasil (Bab 1-3)',
                'file_path' => 'documents/demo-semhas-arbiyan.pdf',
                'file_name' => 'Laporan_Semhas_Arbiyan.pdf',
                'file_size' => '3.2 MB',
                'similarity_score' => null,
            ],
            [
                'category' => 'laporan_akhir',
                'title' => 'Naskah Lengkap Tugas Akhir',
                'file_path' => 'documents/demo-laporan-akhir-arbiyan.pdf',
                'file_name' => 'Naskah_Lengkap_TA_Arbiyan.pdf',
                'file_size' => '5.4 MB',
                'similarity_score' => null,
            ],
            [
                'category' => 'ithenticate',
                'title' => 'Sertifikat Cek Plagiarisme iThenticate',
                'file_path' => 'documents/demo-ithenticate-arbiyan.pdf',
                'file_name' => 'Sertifikat_iThenticate_14_Persen.pdf',
                'file_size' => '0.9 MB',
                'similarity_score' => 14.00,
            ],
        ];

        foreach ($demoDocs as $doc) {
            TaDocument::firstOrCreate(
                ['user_id' => $mhs1->id, 'category' => $doc['category']],
                [
                    'team_id' => $teamId,
                    'title' => $doc['title'],
                    'file_path' => $doc['file_path'],
                    'file_name' => $doc['file_name'],
                    'file_size' => $doc['file_size'],
                    'similarity_score' => $doc['similarity_score'],
                    'version' => 1,
                    'status' => 'approved',
                    'reviewed_by' => $dosen1->id,
                    'reviewer_notes' => 'Berkas telah diperiksa dan memenuhi standar.',
                    'reviewed_at' => now(),
                ]
            );
        }

        // Pendaftaran Sempro & Semhas sudah Approved
        MilestoneRegistration::firstOrCreate(
            ['mahasiswa_id' => $mhs1->id, 'milestone_type' => 'Sempro'],
            [
                'dokumen_kti_link' => 'https://drive.google.com/file/d/demo-proposal-arbiyan',
                'dokumen_produk_link' => 'https://github.com/Xen1try/manajemen-ta',
                'jumlah_kehadiran_seminar' => 5,
                'status' => 'approved',
            ]
        );
        MilestoneRegistration::firstOrCreate(
            ['mahasiswa_id' => $mhs1->id, 'milestone_type' => 'Semhas'],
            [
                'dokumen_kti_link' => 'https://drive.google.com/file/d/demo-semhas-arbiyan',
                'dokumen_produk_link' => 'https://github.com/Xen1try/manajemen-ta',
                'jumlah_kehadiran_seminar' => 5,
                'status' => 'approved',
            ]
        );

        // =========================================================================
        // 2. SKENARIO BURSA JUDUL & VECTOR MATCHMAKING (Tipe 2 & Mandiri)
        // =========================================================================
        $topik1 = TaProject::firstOrCreate(
            ['judul' => 'Predictive Maintenance Mesin CNC Berbasis IoT & Machine Learning'],
            [
                'academic_year_id' => $academicYear->id,
                'tipe' => 'Tipe 2',
                'deskripsi' => 'Monitoring getaran dan suhu spindle mesin CNC secara real-time untuk memprediksi keausan pahat.',
                'required_skills' => [
                    ['name' => 'Web Development', 'level' => 1],
                    ['name' => 'Machine Learning', 'level' => 3],
                    ['name' => 'Internet of Things', 'level' => 4],
                    ['name' => 'PLC & Automation', 'level' => 1],
                    ['name' => 'Mechanical Design', 'level' => 1],
                ],
                'kuota' => 2,
                'pengusul_id' => $dosen2->id,
                'status' => 'Matchmaking',
            ]
        );
        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $topik1->id, 'dosen_id' => $dosen2->id],
            ['role' => 'Utama', 'urutan' => 1]
        );

        $topik2 = TaProject::firstOrCreate(
            ['judul' => 'Dashboard Digital Twin & OEE Lini Produksi Manufaktur'],
            [
                'academic_year_id' => $academicYear->id,
                'tipe' => 'Tipe 2',
                'deskripsi' => 'Visualisasi kinerja lini produksi secara real-time terintegrasi dengan PLC dan database SQL Server.',
                'required_skills' => [
                    ['name' => 'Web Development', 'level' => 3],
                    ['name' => 'Machine Learning', 'level' => 2],
                    ['name' => 'Internet of Things', 'level' => 1],
                    ['name' => 'PLC & Automation', 'level' => 1],
                    ['name' => 'Mechanical Design', 'level' => 1],
                ],
                'kuota' => 2,
                'pengusul_id' => $dosen1->id,
                'status' => 'Matchmaking',
            ]
        );
        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $topik2->id, 'dosen_id' => $dosen1->id],
            ['role' => 'Utama', 'urutan' => 1]
        );

        $topik3 = TaProject::firstOrCreate(
            ['judul' => 'Otomasi Sorting Conveyor Berbasis PLC Siemens & Computer Vision'],
            [
                'academic_year_id' => $academicYear->id,
                'tipe' => 'Tipe 2',
                'deskripsi' => 'Sistem pemilahan produk cacat otomatis menggunakan kamera industri dan aktuator pneumatik.',
                'required_skills' => [
                    ['name' => 'Web Development', 'level' => 1],
                    ['name' => 'Machine Learning', 'level' => 3],
                    ['name' => 'Internet of Things', 'level' => 1],
                    ['name' => 'PLC & Automation', 'level' => 3],
                    ['name' => 'Mechanical Design', 'level' => 1],
                ],
                'kuota' => 1,
                'pengusul_id' => $dosen3->id,
                'status' => 'Matchmaking',
            ]
        );
        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $topik3->id, 'dosen_id' => $dosen3->id],
            ['role' => 'Utama', 'urutan' => 1]
        );

        // Pengajuan Judul Mandiri (Enum tipe = 'Mandiri', status = 'Pending Kaprodi')
        $topikMandiri = TaProject::firstOrCreate(
            ['judul' => 'Sistem Monitoring Energi Panel Surya Irigasi Pertanian Desa Cibolerang'],
            [
                'academic_year_id' => $academicYear->id,
                'tipe' => 'Mandiri',
                'deskripsi' => 'Pengajuan judul mandiri mahasiswa untuk pemantauan daya panel surya dan debit air irigasi berbasis ESP32.',
                'kuota' => 1,
                'pengusul_id' => $mhs3->id,
                'status' => 'Pending Kaprodi',
            ]
        );
        $topikMandiri->mahasiswas()->syncWithoutDetaching([$mhs3->id]);
        ProjectPembimbing::firstOrCreate(
            ['ta_project_id' => $topikMandiri->id, 'dosen_id' => $dosen2->id],
            ['role' => 'Utama', 'urutan' => 1]
        );

        // Kunci pilihan prioritas untuk Aqila agar Panitia/Admin bisa langsung demo tombol "Jalankan Matchmaking"
        TemaSelection::updateOrCreate(
            ['academic_year_id' => $academicYear->id, 'mahasiswa_id' => $mhs2->id],
            [
                'pilihan_1_id' => $topik1->id,
                'pilihan_2_id' => $topik2->id,
                'pilihan_3_id' => $topik3->id,
                'status' => 'Locked',
                'locked_at' => now()->subMinutes(10),
            ]
        );

        // =========================================================================
        // 3. SET KETERSEDIAAN HARI DOSEN (Besok & Lusa) UNTUK DEMO AUTO-SCHEDULER
        // =========================================================================
        DosenAvailability::whereIn('user_id', [$dosen1->id, $dosen2->id, $dosen3->id])
            ->whereIn('date', [$besok, $lusa])
            ->delete();

        foreach ([$dosen1, $dosen2, $dosen3] as $dosen) {
            foreach ([$besok, $lusa] as $tanggal) {
                DosenAvailability::create([
                    'user_id' => $dosen->id,
                    'date' => $tanggal,
                    'time_start' => null,
                    'time_end' => null,
                    'keterangan' => 'Tersedia seharian (Sesi Pagi, Siang, Sore)',
                ]);
            }
        }

        $this->command->info('Seeder demo lengkap berhasil dijalankan tanpa error!');
    }
}