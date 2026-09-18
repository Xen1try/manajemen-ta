import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Database, Plus, Trash2, Library, BookOpen, GraduationCap } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Data Master', href: '/master-data' }
];

export default function MasterData({ prodis, competencies, jabatans }: any) {
    const { currentTeam } = usePage().props as any;

    const formProdi = useForm({ name: '', code: '' });
    const formComp = useForm({ name: '', code: '' });
    const formJabatan = useForm({ name: '', weight_score: 1 });

    const submitProdi = (e: any) => { e.preventDefault(); formProdi.post(`/${currentTeam.slug}/master-data/prodi`, { onSuccess: () => formProdi.reset() }); };
    const submitComp = (e: any) => { e.preventDefault(); formComp.post(`/${currentTeam.slug}/master-data/competency`, { onSuccess: () => formComp.reset() }); };
    const submitJabatan = (e: any) => { e.preventDefault(); formJabatan.post(`/${currentTeam.slug}/master-data/jabatan`, { onSuccess: () => formJabatan.reset() }); };

    const del = (url: string) => { if(confirm('Hapus data ini?')) formProdi.delete(`/${currentTeam.slug}/${url}`); };

    return (
        <>
            <Head title="Data Master Sistem" />
            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-3"><Database className="text-blue-600"/> Data Master</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola referensi pusat Prodi, Skill Kompetensi, dan Bobot Jabatan Fungsional secara dinamis.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Panel Prodi */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200"><Library size={18} className="text-indigo-500"/> Program Studi</div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800 flex-1 overflow-y-auto max-h-64">
                            {prodis.map((p: any) => (
                                <div key={p.id} className="p-3 flex justify-between items-center text-sm">
                                    <span>{p.name} <span className="text-[10px] text-slate-400 font-mono ml-1">{p.code}</span></span>
                                    <button onClick={() => del(`master-data/prodi/${p.id}`)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={submitProdi} className="p-3 bg-slate-50 dark:bg-zinc-950 flex flex-col gap-2 border-t border-slate-100 dark:border-zinc-800">
                            <input type="text" placeholder="Kode (ex: MEK)" value={formProdi.data.code} onChange={e => formProdi.setData('code', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200" required/>
                            <input type="text" placeholder="Nama Prodi" value={formProdi.data.name} onChange={e => formProdi.setData('name', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200" required/>
                            <button className="bg-indigo-600 text-white text-xs py-2 rounded font-bold">Tambah Prodi</button>
                        </form>
                    </div>

                    {/* Panel Kompetensi */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200"><BookOpen size={18} className="text-emerald-500"/> Skill Vector (Kompetensi)</div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800 flex-1 overflow-y-auto max-h-64">
                            {competencies.map((c: any) => (
                                <div key={c.id} className="p-3 flex justify-between items-center text-sm">
                                    <span>{c.name} <span className="text-[10px] text-slate-400 font-mono ml-1">{c.code}</span></span>
                                    <button onClick={() => del(`master-data/competency/${c.id}`)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={submitComp} className="p-3 bg-slate-50 dark:bg-zinc-950 flex flex-col gap-2 border-t border-slate-100 dark:border-zinc-800">
                            <input type="text" placeholder="Kode JSON (ex: ai)" value={formComp.data.code} onChange={e => formComp.setData('code', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200" required/>
                            <input type="text" placeholder="Nama Kompetensi" value={formComp.data.name} onChange={e => formComp.setData('name', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200" required/>
                            <button className="bg-emerald-600 text-white text-xs py-2 rounded font-bold">Tambah Skill</button>
                        </form>
                    </div>

                    {/* Panel Jabatan Fungsional */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200"><GraduationCap size={18} className="text-amber-500"/> Jabatan Fungsional</div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800 flex-1 overflow-y-auto max-h-64">
                            {jabatans.map((j: any) => (
                                <div key={j.id} className="p-3 flex justify-between items-center text-sm">
                                    <span>{j.name} <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold ml-1">Bobot: {j.weight_score}</span></span>
                                    <button onClick={() => del(`master-data/jabatan/${j.id}`)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={submitJabatan} className="p-3 bg-slate-50 dark:bg-zinc-950 flex flex-col gap-2 border-t border-slate-100 dark:border-zinc-800">
                            <input type="number" placeholder="Bobot (ex: 4)" value={formJabatan.data.weight_score} onChange={e => formJabatan.setData('weight_score', parseInt(e.target.value))} className="w-full text-xs p-2 rounded border-slate-200" required/>
                            <input type="text" placeholder="Nama Jabatan" value={formJabatan.data.name} onChange={e => formJabatan.setData('name', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200" required/>
                            <button className="bg-amber-600 text-white text-xs py-2 rounded font-bold">Tambah Jabatan</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

MasterData.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);