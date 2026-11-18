import React, { useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    CheckSquare,
    Key,
    Layers,
    Plus,
    Search,
    ShieldAlert,
    ShieldCheck,
    Square,
    Trash2,
    UserCog,
    Users,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Pengaturan RBAC', href: '/rbac' },
];

export default function RbacSettings({ rolesData, usersData, modules, totalUsers }: any) {
    const { currentTeam } = usePage().props as any;

    // 3 Tab terpisah agar matriks permission punya ruang penuh saat terus berekspansi
    const [activeTab, setActiveTab] = useState<'matrix' | 'roles' | 'users'>('matrix');

    // State Tab 1: Matriks Permission
    const [permSearch, setPermSearch] = useState('');
    const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');

    // State Tab 2: Manajemen Role
    const [newRole, setNewRole] = useState('');

    // State Tab 3: Distribusi Role Pengguna
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

    const toggleRole = (userId: number, roleId: number) => {
        router.post(
            `/${currentTeam.slug}/rbac/users/${userId}/roles/${roleId}`,
            {},
            { preserveScroll: true },
        );
    };

    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole.trim()) return;
        router.post(
            `/${currentTeam.slug}/rbac/roles`,
            { name: newRole },
            {
                preserveScroll: true,
                onSuccess: () => setNewRole(''),
            },
        );
    };

    const handleDeleteRole = (roleId: number) => {
        if (confirm('Hapus role ini? Hak akses terkait akan tercabut otomatis dari pengguna.')) {
            router.delete(`/${currentTeam.slug}/rbac/roles/${roleId}`, { preserveScroll: true });
        }
    };

    const togglePermission = (roleId: number, moduleKey: string, currentValue: boolean) => {
        router.post(
            `/${currentTeam.slug}/rbac/roles/${roleId}/permissions`,
            {
                module: moduleKey,
                value: !currentValue,
            },
            { preserveScroll: true },
        );
    };

    const toggleModuleBulk = (roleId: number, keys: string[], grant: boolean) => {
        router.post(
            `/${currentTeam.slug}/rbac/roles/${roleId}/permissions/bulk`,
            {
                keys,
                grant,
            },
            { preserveScroll: true },
        );
    };

    const totalPermissions = useMemo(
        () => modules.reduce((acc: number, mod: any) => acc + mod.permissions.length, 0),
        [modules],
    );

    const filteredModules = useMemo(() => {
        return modules
            .filter((mod: any) => selectedModuleFilter === 'all' || mod.slug === selectedModuleFilter)
            .map((mod: any) => {
                if (!permSearch.trim()) return mod;
                const q = permSearch.toLowerCase();
                const matchModName = mod.name.toLowerCase().includes(q);
                const matchingPerms = mod.permissions.filter(
                    (p: any) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
                );
                return {
                    ...mod,
                    permissions: matchModName ? mod.permissions : matchingPerms,
                };
            })
            .filter((mod: any) => mod.permissions.length > 0);
    }, [modules, selectedModuleFilter, permSearch]);

    const filteredUsers = useMemo(() => {
        return usersData.filter((user: any) => {
            const q = userSearch.toLowerCase();
            const matchQuery =
                user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
            const matchRole =
                userRoleFilter === 'all' ||
                user.roles?.some((r: any) => String(r.id) === userRoleFilter);
            return matchQuery && matchRole;
        });
    }, [usersData, userSearch, userRoleFilter]);

    return (
        <>
            <Head title="Pengaturan RBAC" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                            Keamanan & Hak Akses Dinamis
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            Role-Based Access Control
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Permission otomatis terdeteksi setiap kali halaman atau route baru ditambahkan ke sistem.
                        </p>
                    </div>

                    {/* Tab Navigasi Utama */}
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-secondary p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('matrix')}
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                activeTab === 'matrix'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Layers size={14} />
                            Matriks Permission ({totalPermissions})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                activeTab === 'roles'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Key size={14} />
                            Daftar Role ({rolesData.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('users')}
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                activeTab === 'users'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Users size={14} />
                            Distribusi Role Pengguna ({totalUsers})
                        </button>
                    </div>
                </div>

                {/* Metrics Ringkas */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                        <div className="mb-2 flex items-start justify-between text-muted-foreground">
                            <p className="text-sm font-medium">Role Aktif</p>
                            <ShieldCheck size={18} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">{rolesData.length}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Peran sistem & kustom</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                        <div className="mb-2 flex items-start justify-between text-muted-foreground">
                            <p className="text-sm font-medium">Pengguna Sistem</p>
                            <Users size={18} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">{totalUsers}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Mendukung multi-role assignment</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                        <div className="mb-2 flex items-start justify-between text-muted-foreground">
                            <p className="text-sm font-medium">Titik Akses Terdeteksi</p>
                            <ShieldAlert size={18} className="text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">{totalPermissions}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Tersebar di {modules.length} modul/halaman aktif
                        </p>
                    </div>
                </div>

                {/* ===================================================================== */}
                {/* TAB 1: LIVE PERMISSION MATRIX (FULL WIDTH + SEARCH & MODULE FILTER)   */}
                {/* ===================================================================== */}
                {activeTab === 'matrix' && (
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 md:flex-row md:items-center">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    AUTO-DISCOVERED LIVE MATRIX
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Pemetaan Akses Granular per Halaman
                                </h2>
                            </div>

                            {/* Pencarian & Filter Modul */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[220px]">
                                    <Search
                                        size={14}
                                        className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <input
                                        type="text"
                                        value={permSearch}
                                        onChange={(e) => setPermSearch(e.target.value)}
                                        placeholder="Cari modul atau permission key..."
                                        className="w-full rounded-lg border border-input bg-background py-1.5 pr-3 pl-8 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <select
                                    value={selectedModuleFilter}
                                    onChange={(e) => setSelectedModuleFilter(e.target.value)}
                                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                                >
                                    <option value="all">Semua Modul ({modules.length})</option>
                                    {modules.map((mod: any) => (
                                        <option key={mod.slug} value={mod.slug}>
                                            {mod.name} ({mod.permissions.length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="max-h-[650px] overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-secondary/95 text-muted-foreground backdrop-blur-xs">
                                    <tr>
                                        <th className="min-w-[260px] p-4 font-bold whitespace-nowrap">
                                            Modul & Aksi (Auto-Discovered)
                                        </th>
                                        {rolesData.map((role: any) => (
                                            <th
                                                key={role.id}
                                                className="min-w-[120px] p-4 text-center font-bold whitespace-nowrap text-foreground"
                                            >
                                                {role.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredModules.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={rolesData.length + 1}
                                                className="p-10 text-center text-sm text-muted-foreground"
                                            >
                                                Tidak ada permission yang cocok dengan kata kunci pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredModules.map((mod: any) => {
                                            const moduleKeys = mod.permissions.map((p: any) => p.key);

                                            return (
                                                <React.Fragment key={mod.slug}>
                                                    {/* Header Baris Modul + Tombol Select All per Role */}
                                                    <tr className="bg-muted/60">
                                                        <td className="px-4 py-2.5 text-xs font-bold tracking-wider text-primary uppercase">
                                                            {mod.name}{' '}
                                                            <span className="font-mono text-[10px] font-normal text-muted-foreground lowercase">
                                                                ({mod.slug}.*)
                                                            </span>
                                                        </td>
                                                        {rolesData.map((role: any) => {
                                                            const disabled = role.name === 'Admin';
                                                            const allChecked =
                                                                disabled ||
                                                                moduleKeys.every((k: string) =>
                                                                    role.permissions?.includes(k),
                                                                );

                                                            return (
                                                                <td
                                                                    key={role.id}
                                                                    className="px-4 py-2 text-center"
                                                                >
                                                                    {!disabled && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                toggleModuleBulk(
                                                                                    role.id,
                                                                                    moduleKeys,
                                                                                    !allChecked,
                                                                                )
                                                                            }
                                                                            title={
                                                                                allChecked
                                                                                    ? `Cabut semua akses ${mod.name} dari ${role.name}`
                                                                                    : `Berikan semua akses ${mod.name} ke ${role.name}`
                                                                            }
                                                                            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                                                                        >
                                                                            {allChecked ? (
                                                                                <>
                                                                                    <CheckSquare
                                                                                        size={11}
                                                                                        className="text-primary"
                                                                                    />{' '}
                                                                                    Semua
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Square size={11} />{' '}
                                                                                    Pilih
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>

                                                    {/* Daftar Permission di dalam Modul */}
                                                    {mod.permissions.map((perm: any) => (
                                                        <tr
                                                            key={perm.key}
                                                            className="transition-colors hover:bg-muted/30"
                                                        >
                                                            <td className="p-3.5 pl-6 text-xs font-medium text-foreground">
                                                                {perm.label}
                                                                <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                                                                    {perm.key}
                                                                </span>
                                                            </td>
                                                            {rolesData.map((role: any) => {
                                                                const isAdmin = role.name === 'Admin';
                                                                const hasPerm =
                                                                    isAdmin ||
                                                                    role.permissions?.includes(perm.key);

                                                                return (
                                                                    <td
                                                                        key={role.id}
                                                                        className="p-3.5 text-center"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={hasPerm || false}
                                                                            disabled={isAdmin}
                                                                            onChange={() =>
                                                                                togglePermission(
                                                                                    role.id,
                                                                                    perm.key,
                                                                                    hasPerm,
                                                                                )
                                                                            }
                                                                            className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                                                        />
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===================================================================== */}
                {/* TAB 2: DAFTAR ROLE SISTEM & PEMBUATAN ROLE BARU                       */}
                {/* ===================================================================== */}
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
                            <div className="border-b border-border p-5">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    MANAJEMEN ROLE
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Daftar Role Terdaftar ({rolesData.length})
                                </h2>
                            </div>

                            <div className="divide-y divide-border">
                                {rolesData.map((role: any) => {
                                    const permCount =
                                        role.name === 'Admin'
                                            ? totalPermissions
                                            : (role.permissions?.length ?? 0);

                                    return (
                                        <div
                                            key={role.id}
                                            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                                    <Key size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground">
                                                        {role.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {role.users_count} pengguna · {permCount} titik akses
                                                        aktif
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                                                    {role.type}
                                                </span>
                                                {role.type === 'Custom' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRole(role.id)}
                                                        title="Hapus role"
                                                        className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-500/10"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <form
                                onSubmit={handleAddRole}
                                className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs"
                            >
                                <div>
                                    <p className="mb-1 text-[10px] font-bold tracking-wider text-primary uppercase">
                                        ROLE KUSTOM
                                    </p>
                                    <h2 className="text-base font-bold text-foreground">Tambah Role Baru</h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Buat peran tambahan (misal: Koordinator TA, Reviewer, Tata Usaha) lalu atur hak aksesnya pada tab Matriks Permission.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                        Nama Role
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Koordinator TA"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                                >
                                    <Plus size={16} /> Tambah Role Baru
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ===================================================================== */}
                {/* TAB 3: DISTRIBUSI ROLE PENGGUNA (MANY-TO-MANY ASSIGNMENT)            */}
                {/* ===================================================================== */}
                {activeTab === 'users' && (
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 md:flex-row md:items-center">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    MULTI-ROLE ASSIGNMENT
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Distribusi Role Pengguna ({filteredUsers.length})
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[220px]">
                                    <Search
                                        size={14}
                                        className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Cari nama atau email pengguna..."
                                        className="w-full rounded-lg border border-input bg-background py-1.5 pr-3 pl-8 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <select
                                    value={userRoleFilter}
                                    onChange={(e) => setUserRoleFilter(e.target.value)}
                                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                                >
                                    <option value="all">Semua Role</option>
                                    {rolesData.map((r: any) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {filteredUsers.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    Pengguna tidak ditemukan.
                                </div>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <div
                                        key={user.id}
                                        className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                                <UserCog size={15} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-bold text-foreground">
                                                    {user.name}
                                                </h3>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap justify-start gap-1.5 sm:justify-end">
                                            {rolesData.map((role: any) => {
                                                const hasRole = user.roles?.some(
                                                    (r: any) => r.id === role.id,
                                                );
                                                const disabled =
                                                    user.email === 'admin@polman-bandung.ac.id' &&
                                                    role.name === 'Admin';

                                                return (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => toggleRole(user.id, role.id)}
                                                        disabled={disabled}
                                                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                                                            hasRole
                                                                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                                : 'border-border bg-transparent text-muted-foreground hover:border-primary/60 hover:text-foreground'
                                                        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    >
                                                        {role.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

RbacSettings.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;