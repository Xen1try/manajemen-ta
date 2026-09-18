<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RbacController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('users')->get();
        $users = User::with('roles:id,name')->latest()->get(); 

        // Granular Permissions (CRUD level)
        $modules = [
            [
                'name' => 'Pengaturan RBAC',
                'permissions' => [
                    ['key' => 'rbac.view', 'label' => 'Akses Halaman RBAC'],
                    ['key' => 'rbac.manage', 'label' => 'Kelola Role & Akses'],
                ]
            ],
            [
                'name' => 'Bimbingan',
                'permissions' => [
                    ['key' => 'bimbingan.read', 'label' => 'Lihat Riwayat (Read)'],
                    ['key' => 'bimbingan.create', 'label' => 'Buat Draft (Create)'],
                    ['key' => 'bimbingan.update', 'label' => 'Validasi/Approve (Update)'],
                    ['key' => 'bimbingan.delete', 'label' => 'Hapus Logbook (Delete)'],
                ]
            ],
            [
                'name' => 'Pengajuan Judul',
                'permissions' => [
                    ['key' => 'judul.read', 'label' => 'Lihat Pengajuan'],
                    ['key' => 'judul.create', 'label' => 'Buat Pengajuan Baru'],
                    ['key' => 'judul.update', 'label' => 'Validasi Kaprodi'],
                ]
            ],
            [
                'name' => 'Jadwal & Sidang',
                'permissions' => [
                    ['key' => 'sidang.read', 'label' => 'Lihat Jadwal'],
                    ['key' => 'sidang.create', 'label' => 'Atur Jadwal (Panitia)'],
                    ['key' => 'sidang.nilai', 'label' => 'Input Nilai (Penguji)'],
                ]
            ]
        ];

        return Inertia::render('rbac', [
            'rolesData' => $roles,
            'usersData' => $users,
            'modules' => $modules,
            'totalUsers' => User::count(),
        ]);
    }

    // Fungsi Baru: Toggle Multi-Role Assignment (Attach/Detach)
    public function toggleUserRole(Request $request, $currentTeam, User $user, Role $role)
    {
        $user->roles()->toggle($role->id);
        return redirect()->back();
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|unique:roles,name']);
        Role::create([
            'name' => $validated['name'],
            'type' => 'Custom',
            'permissions' => [],
        ]);
        return redirect()->back();
    }

    public function destroyRole($currentTeam, Role $role)
    {
        if (in_array($role->type, ['System', 'Default'])) {
            return redirect()->back()->with('error', 'Role bawaan sistem tidak boleh dihapus.');
        }

        $role->delete(); // Otomatis cascade di tabel role_user
        return redirect()->back();
    }

    public function updatePermission(Request $request, $currentTeam, Role $role)
    {
        $validated = $request->validate([
            'module' => 'required|string',
            'value' => 'required|boolean',
        ]);

        $permissions = $role->permissions ?? [];

        if ($validated['value']) {
            if (!in_array($validated['module'], $permissions)) {
                $permissions[] = $validated['module'];
            }
        } else {
            $permissions = array_filter($permissions, fn($p) => $p !== $validated['module']);
        }

        $role->update(['permissions' => array_values($permissions)]);
        return redirect()->back();
    }
}