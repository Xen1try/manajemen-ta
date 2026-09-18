<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Data Master
        \App\Models\Prodi::insert([
            ['name' => 'Teknologi Rekayasa Mekatronika', 'code' => 'TRMO'],
            ['name' => 'Teknologi Rekayasa Otomasi', 'code' => 'TRO'],
            ['name' => 'Teknologi Rekayasa Informatika Industri', 'code' => 'TRIN'],
        ]);

        \App\Models\Competency::insert([
            ['name' => 'Mekanik & Hardware', 'code' => 'mech'],
            ['name' => 'Kontrol, Auto & PLC', 'code' => 'auto'],
            ['name' => 'Software & IT', 'code' => 'info'],
        ]);

        \App\Models\JabatanFungsional::insert([
            ['name' => 'Asisten Ahli', 'weight_score' => 1],
            ['name' => 'Lektor', 'weight_score' => 2],
            ['name' => 'Lektor Kepala', 'weight_score' => 3],
            ['name' => 'Guru Besar', 'weight_score' => 4],
        ]);

        // Roles & Permissions (Tambahkan master.manage untuk Admin)
        $roles = [
            [
                'name' => 'Admin', 
                'type' => 'System', 
                'permissions' => [
                    'rbac.view', 'rbac.manage', 'master.manage',
                    'bimbingan.read', 'bimbingan.create', 'bimbingan.update', 'bimbingan.delete',
                    'judul.read', 'judul.create', 'judul.update',
                    'sidang.read', 'sidang.create', 'sidang.nilai'
                ]
            ],
            ['name' => 'Dosen Pembimbing', 'type' => 'System', 'permissions' => ['bimbingan.read', 'bimbingan.update']], 
            ['name' => 'Mahasiswa', 'type' => 'Default', 'permissions' => ['bimbingan.read', 'bimbingan.create']], 
        ];

        foreach ($roles as $r) {
            Role::create($r);
        }

        $password = Hash::make('password');
        $admin = User::factory()->create(['name' => 'System Administrator', 'email' => 'admin@polman-bandung.ac.id', 'password' => $password]);
        $dosen = User::factory()->create(['name' => 'Mohammad Harry Khomas Saputra', 'email' => 'dosen@polman-bandung.ac.id', 'password' => $password]);
        $mhs = User::factory()->create(['name' => 'Arbiyan Saputra', 'email' => 'mahasiswa@polman-bandung.ac.id', 'password' => $password]);

        $admin->roles()->attach(Role::where('name', 'Admin')->first());
        $dosen->roles()->attach(Role::where('name', 'Dosen Pembimbing')->first());
        $mhs->roles()->attach(Role::where('name', 'Mahasiswa')->first());
    }
}