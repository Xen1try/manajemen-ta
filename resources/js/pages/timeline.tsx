import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Clock, Plus, CheckCircle2, Play, Calendar, Save, Trash2, Flag, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Kontrol Timeline', href: '/timeline-kontrol' },
];

// Komponen Row untuk Tiap Fase Timeline
const TimelineRow = ({ item, index, totalItems, teamSlug, moveItem }: any) => {
    const editForm = useForm({
        name: item.name || '',
        start_date: item.start_date || '',
        end_date: item.end_date || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.put(`/${teamSlug}/timeline-items/${item.id}`, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (confirm(`Hapus fase "${item.name}"?`)) {
            router.delete(`/${teamSlug}/timeline-items/${item.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm gap-4 hover:border-blue-300 transition-colors relative group">
            
            {/* Tombol Reorder */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1.5 bg-white dark:bg-zinc-800 rounded border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={14}/></button>
                <button onClick={() => moveItem(index, 'down')} disabled={index === totalItems - 1} className="p-1.5 bg-white dark:bg-zinc-800 rounded border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={14}/></button>
            </div>

            <form onSubmit={submit} className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-[250px] flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 shadow-inner">
                        {item.order_index}
                    </div>
                    <div className="flex-1">
                        <input type="text" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} className="font-bold text-slate-900 dark:text-zinc-100 text-sm border-0 border-b border-dashed border-slate-300 focus:ring-0 px-0 py-0.5 bg-transparent w-full" required />
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">{item.system_code}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mulai</label>
                        <input type="date" value={editForm.data.start_date} onChange={e => editForm.setData('start_date', e.target.value)} className="text-xs rounded border-slate-200 p-1.5 dark:bg-zinc-950 dark:border-zinc-700" />
                    </div>
                    <span className="text-slate-300 font-bold mt-4">-</span>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Selesai</label>
                        <input type="date" value={editForm.data.end_date} onChange={e => editForm.setData('end_date', e.target.value)} className="text-xs rounded border-slate-200 p-1.5 dark:bg-zinc-950 dark:border-zinc-700" />
                    </div>
                    
                    <button type="submit" disabled={editForm.processing || !editForm.isDirty} className={`mt-4 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${editForm.isDirty ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-400 dark:bg-zinc-800'}`}>
                        <Save size={14} /> Simpan
                    </button>
                    <button type="button" onClick={handleDelete} className="mt-4 px-2 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 size={16}/></button>
                </div>
            </form>
        </div>
    );
};

export default function TimelineControl({ academicYears = [] }: any) {
    const { currentTeam } = usePage().props as any;
    const [selectedYearId, setSelectedYearId] = useState<number | null>(academicYears.length > 0 ? academicYears[0].id : null);

    const activeYear = academicYears.find((ay: any) => ay.is_active);
    const viewYear = academicYears.find((ay: any) => ay.id === selectedYearId);
    
    const formAY = useForm({ name: '', semester: 'Ganjil' });
    const formNewItem = useForm({ name: '' }); // Form tambah fase baru

    const submitAY = (e: React.FormEvent) => {
        e.preventDefault();
        formAY.post(`/${currentTeam.slug}/academic-years`, { onSuccess: () => formAY.reset() });
    };

    const handleSetActive = (id: number) => {
        if (confirm('Aktifkan Tahun Ajaran ini? Ini akan mengubah data default yang tampil di seluruh sistem.')) {
            router.post(`/${currentTeam.slug}/academic-years/${id}/set-active`);
        }
    };

    const handleDeleteAY = (id: number) => {
        if (confirm('Hapus Tahun Ajaran beserta seluruh Blueprint-nya? Data mahasiswa yang terikat tidak akan terhapus.')) {
            router.delete(`/${currentTeam.slug}/academic-years/${id}`);
        }
    };

    const handleGenerateTimeline = (id: number) => {
        router.post(`/${currentTeam.slug}/academic-years/${id}/generate-timeline`);
    };

    const submitNewItem = (e: React.FormEvent, timelineId: number) => {
        e.preventDefault();
        formNewItem.post(`/${currentTeam.slug}/timelines/${timelineId}/items`, { onSuccess: () => formNewItem.reset(), preserveScroll: true });
    };

    // Fungsi Reorder Items
    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (!viewYear || !viewYear.timelines[0]) return;
        const items = [...viewYear.timelines[0].items];
        
        if (direction === 'up' && index > 0) {
            [items[index - 1], items[index]] = [items[index], items[index - 1]];
        } else if (direction === 'down' && index < items.length - 1) {
            [items[index + 1], items[index]] = [items[index], items[index + 1]];
        } else { return; }
        
        // Buat payload urutan baru
        const payload = items.map((itm, idx) => ({ id: itm.id, order_index: idx + 1 }));
        router.post(`/${currentTeam.slug}/timelines/${viewYear.timelines[0].id}/reorder`, { items: payload }, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Kontrol Timeline & Tahun Ajaran" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-3">
                        <Clock className="text-blue-600"/> Kontrol Timeline & Tahun Ajaran
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola siklus akademik, geser urutan fase tugas akhir, dan isolasi data per angkatan.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Panel Kiri: Daftar Tahun Ajaran */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col h-max overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                            <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Tahun Ajaran</h3>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
                            {academicYears.map((ay: any) => (
                                <div key={ay.id} onClick={() => setSelectedYearId(ay.id)} className={`p-4 cursor-pointer transition-colors border-l-4 flex justify-between items-center ${selectedYearId === ay.id ? 'bg-blue-50 border-blue-600 dark:bg-blue-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                            {ay.name} 
                                            {ay.is_active && <CheckCircle2 size={14} className="text-emerald-500"/>}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500">{ay.semester}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!ay.is_active && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); handleSetActive(ay.id); }} className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded" title="Set Active"><Flag size={14}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAY(ay.id); }} className="text-rose-500 hover:bg-rose-100 p-1.5 rounded" title="Hapus"><Trash2 size={14}/></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={submitAY} className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 space-y-3">
                            <input type="text" placeholder="Cth: 2026/2027" value={formAY.data.name} onChange={e => formAY.setData('name', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200 dark:bg-zinc-900" required/>
                            <select value={formAY.data.semester} onChange={e => formAY.setData('semester', e.target.value)} className="w-full text-xs p-2 rounded border-slate-200 dark:bg-zinc-900" required>
                                <option value="Ganjil">Semester Ganjil</option>
                                <option value="Genap">Semester Genap</option>
                            </select>
                            <button disabled={formAY.processing} className="w-full bg-slate-800 dark:bg-white dark:text-zinc-900 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1">
                                <Plus size={14}/> Tambah Tahun
                            </button>
                        </form>
                    </div>

                    {/* Panel Kanan: Timeline Blueprint */}
                    <div className="lg:col-span-3">
                        {!viewYear ? (
                            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-slate-200 dark:border-zinc-800 text-center text-slate-500 h-full flex flex-col items-center justify-center">
                                <Calendar size={32} className="mb-2 opacity-50"/>
                                <p>Pilih Tahun Ajaran di panel kiri.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-zinc-950 p-6 md:p-8 md:ml-12 rounded-xl border border-slate-200 dark:border-zinc-800 h-full">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Blueprint: {viewYear.name} ({viewYear.semester})</h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Status: {viewYear.is_active ? <span className="text-emerald-600 font-bold">Sedang Berjalan (Active)</span> : <span className="text-slate-400 font-bold">Arsip (Inactive)</span>}
                                        </p>
                                    </div>
                                    
                                    {(!viewYear.timelines || viewYear.timelines.length === 0 || viewYear.timelines[0].items.length === 0) && (
                                        <button onClick={() => handleGenerateTimeline(viewYear.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow">
                                            <Play size={16}/> Generate Default Timeline
                                        </button>
                                    )}
                                </div>

                                {viewYear.timelines && viewYear.timelines.length > 0 && viewYear.timelines[0].items.length > 0 && (
                                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[31px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                        {viewYear.timelines[0].items.map((item: any, index: number) => (
                                            <div key={item.id} className="relative z-10">
                                                <TimelineRow item={item} index={index} totalItems={viewYear.timelines[0].items.length} teamSlug={currentTeam.slug} moveItem={moveItem} />
                                            </div>
                                        ))}

                                        {/* Row Tambah Fase Baru */}
                                        <div className="relative z-10 pt-4">
                                            <form onSubmit={(e) => submitNewItem(e, viewYear.timelines[0].id)} className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-700 p-4 rounded-xl">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><Plus size={16}/></div>
                                                <input type="text" placeholder="Masukkan nama fase baru (Cth: Pelatihan K3)" value={formNewItem.data.name} onChange={e => formNewItem.setData('name', e.target.value)} className="text-sm border-0 border-b border-slate-200 focus:ring-0 px-0 py-1 bg-transparent flex-1" required />
                                                <button type="submit" disabled={formNewItem.processing} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg shrink-0">Tambah Fase</button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

TimelineControl.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);