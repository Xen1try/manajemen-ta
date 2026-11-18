<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RbacController extends Controller
{
    /**
     * Label modul & aksi khusus agar terbaca manusiawi di UI.
     * Modul/halaman baru yang belum terdaftar di sini akan otomatis diformat dari slug/key-nya.
     */
    private array $moduleLabels = [
        'rbac' => 'Pengaturan RBAC',
        'bimbingan' => 'Bimbingan & Logbook',
        'judul' => 'Pengajuan Judul',
        'sidang' => 'Jadwal & Sidang',
        'jadwal' => 'Jadwal Seminar & Sidang',
        'kehadiran-seminar' => 'Kehadiran Seminar',
        'dokumen' => 'Dokumen & iThenticate',
        'pendaftaran' => 'Pendaftaran Sidang',
        'penilaian' => 'Penilaian Penguji & Pembimbing',
        'master' => 'Master Data Akademik',
    ];

    private array $actionLabels = [
        'view' => 'Akses Halaman (View)',
        'read' => 'Lihat Data (Read)',
        'create' => 'Tambah / Buat Baru (Create)',
        'update' => 'Ubah / Validasi (Update)',
        'delete' => 'Hapus Data (Delete)',
        'manage' => 'Kelola Penuh (Manage)',
        'verify' => 'Verifikasi / Approve (Verify)',
        'nilai' => 'Input Nilai (Score)',
        'publish' => 'Publikasi (Publish)',
        'export' => 'Unduh / Export Laporan',
    ];

    public function index()
    {
        $roles = Role::withCount('users')->get();
        $users = User::with('roles:id,name')->latest()->get();
        $modules = $this->discoverModulesAndPermissions();

        return Inertia::render('rbac', [
            'rolesData' => $roles,
            'usersData' => $users,
            'modules' => $modules,
            'totalUsers' => User::count(),
        ]);
    }

    /**
     * Memindai seluruh route secara dinamis untuk menemukan permission baru
     * baik dari middleware `permission:...` maupun dari route halaman baru.
     */
    private function discoverModulesAndPermissions(): array
    {
        $discoveredKeys = [];

        // 1. Pindai seluruh route yang terdaftar di aplikasi
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            // Abaikan route internal framework (sanctum, ignition, dll)
            if (Str::startsWith($uri, ['_', 'sanctum', 'up', 'storage'])) {
                continue;
            }

            // A. Tangkap eksplisit dari middleware `permission:xxx` atau `permission:xxx,yyy`
            foreach ($route->gatherMiddleware() as $middleware) {
                if (is_string($middleware) && Str::startsWith($middleware, 'permission:')) {
                    $rawPerms = Str::after($middleware, 'permission:');
                    foreach (explode(',', $rawPerms) as $perm) {
                        $perm = trim($perm);
                        if ($perm !== '') {
                            $discoveredKeys[$perm] = true;
                        }
                    }
                }
            }

            // B. Auto-discover halaman baru di bawah `{current_team}/...`
            if (Str::startsWith($uri, '{current_team}/')) {
                $relativePath = Str::after($uri, '{current_team}/');
                $segments = explode('/', $relativePath);
                $moduleSlug = $segments[0] ?? '';

                // Abaikan sub-route pengaturan akun bawaan starter kit
                if ($moduleSlug === '' || in_array($moduleSlug, ['settings', 'dashboard'])) {
                    continue;
                }

                $methods = $route->methods();
                if (in_array('GET', $methods)) {
                    $discoveredKeys["{$moduleSlug}.read"] = true;
                }
                if (in_array('POST', $methods)) {
                    // Cek apakah endpoint khusus verifikasi/publish
                    if (Str::contains($relativePath, 'verify')) {
                        $discoveredKeys["{$moduleSlug}.verify"] = true;
                    } elseif (Str::contains($relativePath, 'publish')) {
                        $discoveredKeys["{$moduleSlug}.publish"] = true;
                    } else {
                        $discoveredKeys["{$moduleSlug}.create"] = true;
                    }
                }
                if (in_array('PUT', $methods) || in_array('PATCH', $methods)) {
                    if (Str::contains($relativePath, 'verify')) {
                        $discoveredKeys["{$moduleSlug}.verify"] = true;
                    } else {
                        $discoveredKeys["{$moduleSlug}.update"] = true;
                    }
                }
                if (in_array('DELETE', $methods)) {
                    $discoveredKeys["{$moduleSlug}.delete"] = true;
                }
            }
        }

        // 2. Pastikan permission yang sudah tersimpan di role manapun tetap ikut terindeks
        foreach (Role::pluck('permissions') as $rolePerms) {
            if (is_array($rolePerms)) {
                foreach ($rolePerms as $perm) {
                    $discoveredKeys[$perm] = true;
                }
            }
        }

        // 3. Kelompokkan berdasarkan prefix modul (sebelum tanda titik)
        $grouped = [];
        foreach (array_keys($discoveredKeys) as $key) {
            [$prefix, $action] = array_pad(explode('.', $key, 2), 2, 'access');

            $moduleTitle = $this->moduleLabels[$prefix]
                ?? Str::headline(str_replace(['-', '_'], ' ', $prefix));

            $actionTitle = $this->actionLabels[$action]
                ?? Str::headline(str_replace(['-', '_'], ' ', $action));

            $grouped[$prefix]['slug'] = $prefix;
            $grouped[$prefix]['name'] = $moduleTitle;
            $grouped[$prefix]['permissions'][$key] = [
                'key' => $key,
                'label' => $actionTitle,
                'action' => $action,
            ];
        }

        // Urutkan aksi dalam setiap modul (view/read -> create -> update -> verify -> delete -> lainnya)
        $actionOrder = ['view' => 1, 'read' => 2, 'create' => 3, 'update' => 4, 'verify' => 5, 'publish' => 6, 'nilai' => 7, 'manage' => 8, 'delete' => 9];

        return collect($grouped)
            ->map(function ($mod) use ($actionOrder) {
                $perms = collect($mod['permissions'])
                    ->sortBy(fn ($p) => $actionOrder[$p['action']] ?? 50)
                    ->values()
                    ->all();

                return [
                    'slug' => $mod['slug'],
                    'name' => $mod['name'],
                    'permissions' => $perms,
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();
    }

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

        $role->delete();
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
            if (! in_array($validated['module'], $permissions)) {
                $permissions[] = $validated['module'];
            }
        } else {
            $permissions = array_values(array_filter($permissions, fn ($p) => $p !== $validated['module']));
        }

        $role->update(['permissions' => $permissions]);
        return redirect()->back();
    }

    /**
     * Bulk toggle semua permission dalam satu modul untuk sebuah role (praktis saat modul terus bertambah).
     */
    public function toggleModulePermissions(Request $request, $currentTeam, Role $role)
    {
        $validated = $request->validate([
            'keys' => 'required|array',
            'keys.*' => 'string',
            'grant' => 'required|boolean',
        ]);

        $permissions = $role->permissions ?? [];

        if ($validated['grant']) {
            $permissions = array_values(array_unique(array_merge($permissions, $validated['keys'])));
        } else {
            $permissions = array_values(array_diff($permissions, $validated['keys']));
        }

        $role->update(['permissions' => $permissions]);
        return redirect()->back();
    }
}