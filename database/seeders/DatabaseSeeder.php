<?php

namespace Database\Seeders;

use App\Actions\Teams\CreateTeam;
use App\Models\AcademicYear;
use App\Models\Competency;
use App\Models\JabatanFungsional;
use App\Models\Prodi;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // =========================================================================
        // 1. DATA MASTER PROGRAM STUDI
        // =========================================================================
        $prodis = [
            ['name' => 'Teknologi Rekayasa Mekatronika', 'code' => 'TRMO'],
            ['name' => 'Teknologi Rekayasa Otomasi', 'code' => 'TRO'],
            ['name' => 'Teknologi Rekayasa Informatika Industri', 'code' => 'TRIN'],
        ];
        foreach ($prodis as $p) {
            Prodi::firstOrCreate(['code' => $p['code']], $p);
        }

        // =========================================================================
        // 2. DATA MASTER KOMPETENSI (SKILL VECTOR)
        // =========================================================================
        $competencies = [
            ['name' => 'Web Development', 'code' => 'web'],
            ['name' => 'Machine Learning', 'code' => 'ml'],
            ['name' => 'Internet of Things', 'code' => 'iot'],
            ['name' => 'PLC & Automation', 'code' => 'plc'],
            ['name' => 'Mechanical Design', 'code' => 'mech'],
        ];
        foreach ($competencies as $c) {
            Competency::firstOrCreate(['code' => $c['code']], $c);
        }

        // =========================================================================
        // 3. DATA MASTER JABATAN FUNGSIONAL & KUOTA BIMBINGAN
        // =========================================================================
        $jabatans = [
            ['name' => 'Asisten Ahli', 'weight_score' => 1, 'max_kuota_bimbingan' => 4],
            ['name' => 'Lektor', 'weight_score' => 2, 'max_kuota_bimbingan' => 6],
            ['name' => 'Lektor Kepala', 'weight_score' => 3, 'max_kuota_bimbingan' => 8],
            ['name' => 'Guru Besar', 'weight_score' => 4, 'max_kuota_bimbingan' => 10],
        ];
        foreach ($jabatans as $j) {
            JabatanFungsional::updateOrCreate(['name' => $j['name']], $j);
        }

        // =========================================================================
        // 4. MANAJEMEN PERAN (ROLES & GRANULAR PERMISSIONS MATRIX 100% LENGKAP)
        // =========================================================================
        $allPermissions = [
            // RBAC & Sistem
            'rbac.view', 'rbac.manage',
            // Data Master & Timeline
            'master.manage', 'timeline.manage',
            // Bimbingan
            'bimbingan.read', 'bimbingan.create', 'bimbingan.update', 'bimbingan.delete', 'bimbingan.verify',
            // Judul & Matchmaking
            'judul.read', 'judul.create', 'judul.update', 'judul.approve',
            // Dokumen TA & iThenticate
            'dokumen.read', 'dokumen.create', 'dokumen.update', 'dokumen.delete', 'dokumen.verify',
            // Kehadiran Seminar
            'kehadiran.read', 'kehadiran.create', 'kehadiran.update', 'kehadiran.delete', 'kehadiran.verify',
            // Pendaftaran Milestone
            'pendaftaran.read', 'pendaftaran.create', 'pendaftaran.verify',
            // Jadwal & Sidang
            'sidang.read', 'sidang.create', 'sidang.update', 'sidang.nilai',
        ];

        $roles = [
            [
                'name' => 'Admin',
                'type' => 'System',
                'permissions' => $allPermissions, // Akses penuh ke seluruh fitur & sidebar
            ],
            [
                'name' => 'Panitia',
                'type' => 'System',
                'permissions' => [
                    'master.manage', 'timeline.manage',
                    'judul.read', 'judul.update', 'judul.approve',
                    'dokumen.read', 'dokumen.verify',
                    'kehadiran.read', 'kehadiran.verify',
                    'pendaftaran.read', 'pendaftaran.verify',
                    'sidang.read', 'sidang.create', 'sidang.update',
                ],
            ],
            [
                'name' => 'Kaprodi',
                'type' => 'System',
                'permissions' => [
                    'master.manage',
                    'judul.read', 'judul.update', 'judul.approve',
                    'dokumen.read',
                    'pendaftaran.read', 'pendaftaran.verify',
                    'sidang.read', 'sidang.create',
                ],
            ],
            [
                'name' => 'Dosen Pembimbing',
                'type' => 'System',
                'permissions' => [
                    'bimbingan.read', 'bimbingan.update', 'bimbingan.verify',
                    'judul.read', 'judul.create', 'judul.update',
                    'dokumen.read', 'dokumen.verify',
                    'kehadiran.read',
                    'pendaftaran.read', 'pendaftaran.verify',
                    'sidang.read', 'sidang.nilai',
                ],
            ],
            [
                'name' => 'Mahasiswa',
                'type' => 'Default',
                'permissions' => [
                    'bimbingan.read', 'bimbingan.create', 'bimbingan.update', 'bimbingan.delete',
                    'judul.read', 'judul.create',
                    'dokumen.read', 'dokumen.create', 'dokumen.update', 'dokumen.delete',
                    'kehadiran.read', 'kehadiran.create', 'kehadiran.update', 'kehadiran.delete',
                    'pendaftaran.read', 'pendaftaran.create',
                    'sidang.read',
                ],
            ],
        ];

        foreach ($roles as $r) {
            Role::updateOrCreate(['name' => $r['name']], $r);
        }

        // =========================================================================
        // 5. TAHUN AJARAN & TIMELINE GATEKEEPER
        // =========================================================================
        AcademicYear::where('is_active', true)->update(['is_active' => false]);

        $academicYear = AcademicYear::updateOrCreate(
            ['name' => '2026/2027', 'semester' => 'Ganjil'],
            ['is_active' => true]
        );
        $timeline = $academicYear->timelines()->firstOrCreate(['name' => 'Timeline Utama']);

        $phases = [
            ['system_code' => 'pembagian_tema', 'name' => 'Fase Pembagian Tema & Matchmaking', 'order_index' => 1, 'start_offset' => -7, 'end_offset' => 14],
            ['system_code' => 'bimbingan_sempro', 'name' => 'Bimbingan & Pendaftaran Sempro', 'order_index' => 2, 'start_offset' => -3, 'end_offset' => 30],
            ['system_code' => 'pelaksanaan_semhas', 'name' => 'Seminar Hasil (Semhas)', 'order_index' => 3, 'start_offset' => -1, 'end_offset' => 60],
            ['system_code' => 'sidang_akhir', 'name' => 'Sidang Tugas Akhir', 'order_index' => 4, 'start_offset' => -1, 'end_offset' => 90],
        ];

        foreach ($phases as $phase) {
            $timeline->items()->updateOrCreate(
                ['system_code' => $phase['system_code']],
                [
                    'name' => $phase['name'],
                    'order_index' => $phase['order_index'],
                    'start_date' => Carbon::today()->addDays($phase['start_offset']),
                    'end_date' => Carbon::today()->addDays($phase['end_offset']),
                ]
            );
        }

        // =========================================================================
        // 6. AKUN PENGGUNA UNTUK SELURUH ROLE & PEMBUATAN TEAM JETSTREAM
        // =========================================================================
        $password = Hash::make('password');
        $createTeamAction = new CreateTeam();

        $userConfigs = [
            ['key' => 'admin', 'name' => 'System Administrator', 'email' => 'admin@polman-bandung.ac.id', 'role' => 'Admin'],
            ['key' => 'panitia', 'name' => 'Panitia Tugas Akhir', 'email' => 'panitia@polman-bandung.ac.id', 'role' => 'Panitia'],
            ['key' => 'kaprodi', 'name' => 'Siti Aminah', 'email' => 'siti@polman-bandung.ac.id', 'role' => 'Kaprodi'],
            ['key' => 'dosen1', 'name' => 'Mohammad Harry Khomas Saputra', 'email' => 'harry@polman-bandung.ac.id', 'role' => 'Dosen Pembimbing'],
            ['key' => 'dosen2', 'name' => 'Danu Jaya Saputro', 'email' => 'danu@polman-bandung.ac.id', 'role' => 'Dosen Pembimbing'],
            ['key' => 'dosen3', 'name' => 'Budi Santoso', 'email' => 'budi@polman-bandung.ac.id', 'role' => 'Dosen Pembimbing'],
            ['key' => 'mhs1', 'name' => 'Arbiyan Saputra', 'email' => 'arbiyan@polman-bandung.ac.id', 'role' => 'Mahasiswa'],
            ['key' => 'mhs2', 'name' => 'Aqila Bihar Ijazilah', 'email' => 'aqila@polman-bandung.ac.id', 'role' => 'Mahasiswa'],
            ['key' => 'mhs3', 'name' => 'Zahra Fajria Riski', 'email' => 'zahra@polman-bandung.ac.id', 'role' => 'Mahasiswa'],
        ];

        $users = [];
        foreach ($userConfigs as $cfg) {
            $user = User::updateOrCreate(
                ['email' => $cfg['email']],
                [
                    'name' => $cfg['name'],
                    'password' => $password,
                    'email_verified_at' => now(),
                ]
            );

            // Buat Team via Action Jetstream agar current_team_id selalu terisi
            if (! $user->current_team_id) {
                $team = $createTeamAction->handle($user, explode(' ', $user->name, 2)[0] . "'s Team");
                $user->forceFill(['current_team_id' => $team->id])->save();
            }

            $role = Role::where('name', $cfg['role'])->first();
            if ($role) {
                $user->roles()->sync([$role->id]);
            }

            $users[$cfg['key']] = $user;
        }

        // =========================================================================
        // 7. PROFIL AKADEMIK DOSEN & MAHASISWA (SKILL VECTOR)
        // =========================================================================
        $trinId = Prodi::where('code', 'TRIN')->first()->id;
        $troId = Prodi::where('code', 'TRO')->first()->id;
        $lektorId = JabatanFungsional::where('name', 'Lektor')->first()->id;
        $lektorKepalaId = JabatanFungsional::where('name', 'Lektor Kepala')->first()->id;
        $guruBesarId = JabatanFungsional::where('name', 'Guru Besar')->first()->id;

        $baseSkills = Competency::all()->map(fn ($c) => ['name' => $c->name, 'level' => 1])->toArray();

        // Kaprodi (Siti Aminah)
        $kaprodiSkills = $baseSkills;
        $kaprodiSkills[0]['level'] = 4;
        $kaprodiSkills[1]['level'] = 5;
        $users['kaprodi']->dosenProfile()->updateOrCreate(
            ['user_id' => $users['kaprodi']->id],
            [
                'nip' => '197803152002122001',
                'prodi_id' => $trinId,
                'jabatan_fungsional_id' => $guruBesarId,
                'skill_vector' => $kaprodiSkills,
            ]
        );

        // Dosen 1 (Harry)
        $dosen1Skills = $baseSkills;
        $dosen1Skills[0]['level'] = 5;
        $dosen1Skills[1]['level'] = 4;
        $users['dosen1']->dosenProfile()->updateOrCreate(
            ['user_id' => $users['dosen1']->id],
            [
                'nip' => '198001012005011001',
                'prodi_id' => $trinId,
                'jabatan_fungsional_id' => $lektorKepalaId,
                'skill_vector' => $dosen1Skills,
            ]
        );

        // Dosen 2 (Danu)
        $dosen2Skills = $baseSkills;
        $dosen2Skills[2]['level'] = 5;
        $dosen2Skills[3]['level'] = 4;
        $users['dosen2']->dosenProfile()->updateOrCreate(
            ['user_id' => $users['dosen2']->id],
            [
                'nip' => '198505052010121002',
                'prodi_id' => $trinId,
                'jabatan_fungsional_id' => $lektorId,
                'skill_vector' => $dosen2Skills,
            ]
        );

        // Dosen 3 (Budi)
        $dosen3Skills = $baseSkills;
        $dosen3Skills[3]['level'] = 4;
        $dosen3Skills[4]['level'] = 5;
        $users['dosen3']->dosenProfile()->updateOrCreate(
            ['user_id' => $users['dosen3']->id],
            [
                'nip' => '198709122012121003',
                'prodi_id' => $troId,
                'jabatan_fungsional_id' => $lektorId,
                'skill_vector' => $dosen3Skills,
            ]
        );

        // Mahasiswa 1 (Arbiyan)
        $mhs1Skills = $baseSkills;
        $mhs1Skills[0]['level'] = 4;
        $mhs1Skills[2]['level'] = 3;
        $users['mhs1']->mahasiswaProfile()->updateOrCreate(
            ['user_id' => $users['mhs1']->id],
            [
                'nim' => '211411001',
                'prodi_id' => $trinId,
                'angkatan' => 2023,
                'academic_status' => 'ready_sempro',
                'skill_vector' => $mhs1Skills,
            ]
        );

        // Mahasiswa 2 (Aqila)
        $mhs2Skills = $baseSkills;
        $mhs2Skills[1]['level'] = 4;
        $mhs2Skills[2]['level'] = 4;
        $users['mhs2']->mahasiswaProfile()->updateOrCreate(
            ['user_id' => $users['mhs2']->id],
            [
                'nim' => '211411002',
                'prodi_id' => $trinId,
                'angkatan' => 2023,
                'academic_status' => 'drafting',
                'skill_vector' => $mhs2Skills,
            ]
        );

        // Mahasiswa 3 (Zahra)
        $mhs3Skills = $baseSkills;
        $mhs3Skills[0]['level'] = 4;
        $mhs3Skills[1]['level'] = 3;
        $users['mhs3']->mahasiswaProfile()->updateOrCreate(
            ['user_id' => $users['mhs3']->id],
            [
                'nim' => '211411003',
                'prodi_id' => $trinId,
                'angkatan' => 2023,
                'academic_status' => 'drafting',
                'skill_vector' => $mhs3Skills,
            ]
        );

        // Jalankan Seeder Skenario Demo Lengkap
        $this->call(ScheduleDemoSeeder::class);
    }
}