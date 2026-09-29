<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Prodi;
use App\Models\Competency;
use App\Models\JabatanFungsional;
use App\Models\AcademicYear;
use App\Actions\Teams\CreateTeam;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Data Master Program Studi
        $prodis = [
            ['name' => 'Teknologi Rekayasa Mekatronika', 'code' => 'TRMO'],
            ['name' => 'Teknologi Rekayasa Otomasi', 'code' => 'TRO'],
            ['name' => 'Teknologi Rekayasa Informatika Industri', 'code' => 'TRIN'],
        ];
        foreach ($prodis as $p) { Prodi::firstOrCreate(['code' => $p['code']], $p); }

        // 2. Data Master Kompetensi (Dibuat spesifik agar algoritma bisa diuji)
        $competencies = [
            ['name' => 'Web Development', 'code' => 'web'],
            ['name' => 'Machine Learning', 'code' => 'ml'],
            ['name' => 'Internet of Things', 'code' => 'iot'],
            ['name' => 'PLC & Automation', 'code' => 'plc'],
            ['name' => 'Mechanical Design', 'code' => 'mech'],
        ];
        foreach ($competencies as $c) { Competency::firstOrCreate(['code' => $c['code']], $c); }

        // 3. Data Master Jabatan Fungsional (Dengan Kuota Bimbingan)
        $jabatans = [
            ['name' => 'Asisten Ahli', 'weight_score' => 1, 'max_kuota_bimbingan' => 4],
            ['name' => 'Lektor', 'weight_score' => 2, 'max_kuota_bimbingan' => 6],
            ['name' => 'Lektor Kepala', 'weight_score' => 3, 'max_kuota_bimbingan' => 8],
            ['name' => 'Guru Besar', 'weight_score' => 4, 'max_kuota_bimbingan' => 10],
        ];
        foreach ($jabatans as $j) { JabatanFungsional::firstOrCreate(['name' => $j['name']], $j); }

        // 4. Manajemen Peran (Roles & Permissions)
        $roles = [
            [
                'name' => 'Admin', 
                'type' => 'System', 
                'permissions' => ['rbac.view', 'rbac.manage', 'master.manage', 'bimbingan.read', 'bimbingan.create', 'bimbingan.update', 'bimbingan.delete', 'judul.read', 'judul.create', 'judul.update', 'sidang.read', 'sidang.create', 'sidang.nilai']
            ],
            [
                'name' => 'Panitia', 
                'type' => 'System', 
                'permissions' => ['master.manage', 'judul.read', 'judul.update', 'sidang.read', 'sidang.create']
            ],
            [
                'name' => 'Kaprodi', 
                'type' => 'System', 
                'permissions' => ['master.manage', 'judul.read', 'judul.update']
            ],
            [
                'name' => 'Dosen Pembimbing', 
                'type' => 'System', 
                'permissions' => ['bimbingan.read', 'bimbingan.update']
            ], 
            [
                'name' => 'Mahasiswa', 
                'type' => 'Default', 
                'permissions' => ['bimbingan.read', 'bimbingan.create']
            ], 
        ];

        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r['name']], $r);
        }

        // 5. Setup Tahun Ajaran dan Timeline Gatekeeper
        $academicYear = AcademicYear::firstOrCreate([
            'name' => '2026/2027', 
            'semester' => 'Ganjil',
            'is_active' => true
        ]);
        $timeline = $academicYear->timelines()->firstOrCreate(['name' => 'Timeline Utama']);
        
        // Membuka gatekeeper fase "pembagian_tema" agar form di UI terbuka
        $timeline->items()->firstOrCreate(
            ['system_code' => 'pembagian_tema'],
            [
                'name' => 'Fase Pembagian Tema',
                'start_date' => Carbon::today()->subDays(2),
                'end_date' => Carbon::today()->addDays(14),
            ]
        );

        // 6. Pembuatan Akun Pengguna & Tim Menggunakan Action Jetstream
        $password = Hash::make('password');
        $createTeamAction = new CreateTeam();

        // Buat Akun
        $admin = User::factory()->create(['name' => 'System Administrator', 'email' => 'admin@polman-bandung.ac.id', 'password' => $password]);
        $kaprodi = User::factory()->create(['name' => 'Siti Aminah', 'email' => 'siti@polman-bandung.ac.id', 'password' => $password]);
        $dosen1 = User::factory()->create(['name' => 'Mohammad Harry Khomas Saputra', 'email' => 'harry@polman-bandung.ac.id', 'password' => $password]);
        $dosen2 = User::factory()->create(['name' => 'Danu Jaya Saputro', 'email' => 'danu@polman-bandung.ac.id', 'password' => $password]);
        $mhs1 = User::factory()->create(['name' => 'Arbiyan Saputra', 'email' => 'arbiyan@polman-bandung.ac.id', 'password' => $password]);
        $mhs2 = User::factory()->create(['name' => 'Aqila Bihar Ijazilah', 'email' => 'aqila@polman-bandung.ac.id', 'password' => $password]);

        // Buat Team untuk tiap user melalui Action Jetstream
        $users = [$admin, $kaprodi, $dosen1, $dosen2, $mhs1, $mhs2];
        foreach ($users as $u) {
            $team = $createTeamAction->handle($u, explode(' ', $u->name, 2)[0] . "'s Team");
            $u->current_team_id = $team->id;
            $u->save();
        }

        // Pasang Role
        $admin->roles()->attach(Role::where('name', 'Admin')->first());
        $kaprodi->roles()->attach(Role::where('name', 'Kaprodi')->first());
        $dosen1->roles()->attach(Role::where('name', 'Dosen Pembimbing')->first());
        $dosen2->roles()->attach(Role::where('name', 'Dosen Pembimbing')->first());
        $mhs1->roles()->attach(Role::where('name', 'Mahasiswa')->first());
        $mhs2->roles()->attach(Role::where('name', 'Mahasiswa')->first());

        // 7. Pengisian Profil Akademik Otomatis (Skala 1-5)
        $trinId = Prodi::where('code', 'TRIN')->first()->id;
        $lektorId = JabatanFungsional::where('name', 'Lektor')->first()->id;
        
        $baseSkills = Competency::all()->map(fn($c) => ['name' => $c->name, 'level' => 1])->toArray();

        // Profil Dosen 1 (Expert di Web, Intermediate di ML)
        $dosen1Skills = $baseSkills;
        $dosen1Skills[0]['level'] = 5; // Web Dev
        $dosen1Skills[1]['level'] = 3; // ML
        $dosen1->dosenProfile()->create([
            'nip' => '198001012005011001',
            'prodi_id' => $trinId,
            'jabatan_fungsional_id' => $lektorId,
            'skill_vector' => $dosen1Skills,
        ]);

        // Profil Dosen 2 (Expert di IoT & PLC)
        $dosen2Skills = $baseSkills;
        $dosen2Skills[2]['level'] = 5; // IoT
        $dosen2Skills[3]['level'] = 4; // PLC
        $dosen2->dosenProfile()->create([
            'nip' => '198505052010121002',
            'prodi_id' => $trinId,
            'jabatan_fungsional_id' => $lektorId,
            'skill_vector' => $dosen2Skills,
        ]);

        // Profil Mahasiswa 1 (Arbiyan - Cukup mahir di Web)
        $mhs1Skills = $baseSkills;
        $mhs1Skills[0]['level'] = 4; // Web Dev
        $mhs1->mahasiswaProfile()->create([
            'nim' => '211411001',
            'prodi_id' => $trinId,
            'angkatan' => 2023,
            'academic_status' => 'drafting',
            'skill_vector' => $mhs1Skills,
        ]);

        // Profil Mahasiswa 2 (Aqila - Cukup mahir di ML dan IoT)
        $mhs2Skills = $baseSkills;
        $mhs2Skills[1]['level'] = 3; // ML
        $mhs2Skills[2]['level'] = 4; // IoT
        $mhs2->mahasiswaProfile()->create([
            'nim' => '211411002',
            'prodi_id' => $trinId,
            'angkatan' => 2023,
            'academic_status' => 'drafting',
            'skill_vector' => $mhs2Skills,
        ]);
    }
}