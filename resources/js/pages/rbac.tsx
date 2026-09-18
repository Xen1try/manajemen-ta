import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ShieldCheck, Users, Key, ShieldAlert, UserCog, Trash2, Plus } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Pengaturan RBAC', href: '/rbac' },
];

export default function RbacSettings({ rolesData, usersData, modules, totalUsers }: any) {
    const { currentTeam } = usePage().props as any;
    const [newRole, setNewRole] = useState('');

    // Toggle Multi-Role
    const toggleRole = (userId: number, roleId: number) => {
        router.post(`/${currentTeam.slug}/rbac/users/${userId}/roles/${roleId}`, {}, { preserveScroll: true });
    };

    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole.trim()) return;
        router.post(`/${currentTeam.slug}/rbac/roles`, { name: newRole }, {
            preserveScroll: true,
            onSuccess: () => setNewRole(''),
        });
    };

    const handleDeleteRole = (roleId: number) => {
        if (confirm('Hapus role ini? Hak akses terkait akan tercabut otomatis dari pengguna.')) {
            router.delete(`/${currentTeam.slug}/rbac/roles/${roleId}`, { preserveScroll: true });
        }
    };

    const togglePermission = (roleId: number, moduleKey: string, currentValue: boolean) => {
        router.post(`/${currentTeam.slug}/rbac/roles/${roleId}/permissions`, {
            module: moduleKey,
            value: !currentValue
        }, { preserveScroll: true });
    };

    // Hitung total permission key untuk metrik
    const totalPermissions = modules.reduce((acc: number, mod: any) => acc + mod.permissions.length, 0);

    return (
        <>
            <Head title="Pengaturan RBAC" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 uppercase">Keamanan & Sistem</p>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Role-Based Access Control</h1>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Kelola peran berganda (many-to-many) dan granular matrix (CRUD level).</p>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Role Aktif</p>
                            <ShieldCheck size={18} className="text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{rolesData.length}</h2>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Pengguna Sistem</p>
                            <Users size={18} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{totalUsers}</h2>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Titik Akses (CRUD)</p>
                            <ShieldAlert size={18} className="text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{totalPermissions}</h2>
                    </div>
                </div>

                {/* Granular Permission Matrix */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider">LIVE PERMISSION MATRIX</p>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Pemetaan Akses Granular (CRUD)</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-zinc-800">
                                <tr>
                                    <th className="p-4 font-bold whitespace-nowrap min-w-[200px]">Modul & Aksi (CRUD)</th>
                                    {rolesData.map((role: any) => (
                                        <th key={role.id} className="p-4 font-bold text-center whitespace-nowrap">{role.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {modules.map((mod: any) => (
                                    <React.Fragment key={mod.name}>
                                        <tr className="bg-slate-100/50 dark:bg-zinc-800/20">
                                            <td colSpan={rolesData.length + 1} className="p-2 px-4 font-bold text-xs text-slate-500 uppercase tracking-wider">{mod.name}</td>
                                        </tr>
                                        {mod.permissions.map((perm: any) => (
                                            <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="p-4 pl-6 font-medium text-slate-800 dark:text-zinc-200 text-xs">
                                                    {perm.label} <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</span>
                                                </td>
                                                {rolesData.map((role: any) => {
                                                    const hasPerm = role.permissions?.includes(perm.key);
                                                    const disabled = role.name === 'Admin'; // Admin tidak bisa di-uncheck
                                                    
                                                    return (
                                                        <td key={role.id} className="p-4 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={hasPerm || false}
                                                                disabled={disabled}
                                                                onChange={() => togglePermission(role.id, perm.key, hasPerm)}
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Multi-Role User Assignment */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden h-max xl:order-last">
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">MULTI-ASSIGNMENT</p>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Distribusi Role Pengguna</h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
                            {usersData.map((user: any) => (
                                <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
                                            <UserCog size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{user.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Role Badges (Many-to-Many Toggle) */}
                                    <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                                        {rolesData.map((role: any) => {
                                            const hasRole = user.roles?.some((r: any) => r.id === role.id);
                                            // Proteksi mencegah Super Admin menghapus role Admin-nya sendiri
                                            const disabled = user.email === 'admin@polman-bandung.ac.id' && role.name === 'Admin';

                                            return (
                                                <button 
                                                    key={role.id}
                                                    onClick={() => toggleRole(user.id, role.id)}
                                                    disabled={disabled}
                                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all ${
                                                        hasRole 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                        : 'bg-transparent border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-blue-400 dark:hover:border-blue-500'
                                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {role.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roles Management List */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col xl:order-first h-max">
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">MANAJEMEN ROLE</p>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Daftar Role Sistem</h2>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800 overflow-y-auto max-h-[300px]">
                            {rolesData.map((role: any) => (
                                <div key={role.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <Key size={14} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{role.name}</h3>
                                            <p className="text-[10px] text-slate-500 dark:text-zinc-400">{role.users_count} pengguna terhubung</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                                            {role.type}
                                        </span>
                                        {role.type === 'Custom' && (
                                            <button onClick={() => handleDeleteRole(role.id)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Form Tambah Role */}
                        <form onSubmit={handleAddRole} className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex gap-2 mt-auto">
                            <input 
                                type="text" 
                                placeholder="Nama Role Baru..."
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="flex-1 text-sm py-1.5 px-3 rounded-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:ring-blue-500 focus:border-blue-500" 
                                required
                            />
                            <button type="submit" className="bg-slate-800 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1">
                                <Plus size={14} /> Tambah
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </>
    );
}

RbacSettings.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);