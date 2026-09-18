import { Head, router, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Calendar as CalendarIcon, MapPin, Settings2, CheckCircle2, 
    AlertTriangle, Play, CalendarX, Edit, Trash2, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Jadwal & Sidang', href: '/jadwal' },
];

export default function Jadwal({ schedules = [], dosens = [], myBlocks = [], isDosen = false }: any) {
    const { currentTeam, auth } = usePage().props as any;
    const canManage = auth?.permissions?.includes('sidang.create') || false;
    const [activeTab, setActiveTab] = useState('draft');
    
    // States untuk Modal Panitia
    const [overrideData, setOverrideData] = useState<any>(null);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);

    // States untuk Kalender Dosen
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

    const filteredSchedules = Array.isArray(schedules) ? schedules.filter((s: any) => s?.status === activeTab) : [];

    // Form Blok Waktu (Dosen) & Edit Waktu (Panitia)
    const blockForm = useForm({ date: '', time_start: '', time_end: '', reason: '' });
    const editForm = useForm({ date: '', time_start: '', time_end: '', room: '' });

    // --- LOGIKA KALENDER ---
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Minggu
    
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const formatDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const handleDayClick = (day: number) => {
        const dateStr = formatDateStr(day);
        setSelectedDateStr(dateStr);
        blockForm.setData('date', dateStr);
    };

    const getBlocksForDate = (dateStr: string) => {
        return Array.isArray(myBlocks) ? myBlocks.filter((b: any) => b?.date === dateStr) : [];
    };
    // ----------------------

    const submitBlock = (e: any) => {
        e.preventDefault();
        blockForm.post(`/${currentTeam?.slug}/jadwal/blocks`, { 
            preserveScroll: true,
            onSuccess: () => blockForm.reset('time_start', 'time_end', 'reason') 
        });
    };

    const submitEditSchedule = (e: any) => {
        e.preventDefault();
        if (!editingSchedule?.id) return;
        editForm.put(`/${currentTeam?.slug}/jadwal/${editingSchedule.id}`, { onSuccess: () => setEditingSchedule(null) });
    };

    const handleAssigneeChange = (scheduleId: number, roleType: string, userId: string, force = false) => {
        if (!userId) return;
        router.post(`/${currentTeam?.slug}/jadwal/${scheduleId}/assignee`, { role_type: roleType, user_id: userId, force: force }, {
            preserveScroll: true,
            onError: (errors: any) => { if (errors?.warning) setOverrideData({ scheduleId, roleType, userId, message: errors.message }); },
            onSuccess: () => setOverrideData(null)
        });
    };

    const openEditModal = (sched: any) => {
        if (!sched) return;
        setEditingSchedule(sched);
        editForm.setData({ 
            date: sched.date || '', 
            time_start: sched.time_start ? sched.time_start.slice(0,5) : '', 
            time_end: sched.time_end ? sched.time_end.slice(0,5) : '', 
            room: sched.room || '' 
        });
    };

    const getAssigneeId = (assignees: any[], role: string) => {
        if (!Array.isArray(assignees)) return '';
        const found = assignees.find((a: any) => a?.role_type === role);
        return found?.user_id || '';
    };

    return (
        <>
            <Head title="Mesin Penjadwalan" />

            {/* Modal Soft Validation */}
            {overrideData && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl max-w-md w-full shadow-xl border border-amber-200">
                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-full shrink-0"><AlertTriangle size={24}/></div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Peringatan Bentrok / Syarat</h3>
                                <p className="text-slate-600 dark:text-zinc-400 text-sm mt-2">{overrideData.message}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setOverrideData(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Batal</button>
                            <button onClick={() => handleAssigneeChange(overrideData.scheduleId, overrideData.roleType, overrideData.userId, true)} className="px-4 py-2 font-bold bg-amber-600 text-white rounded-lg text-sm">Force Override</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Waktu & Ruang (Panitia) */}
            {editingSchedule && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl max-w-md w-full shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Edit Waktu & Ruangan</h3>
                        <form onSubmit={submitEditSchedule} className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label><input type="date" value={editForm.data.date} onChange={e => editForm.setData('date', e.target.value)} className="w-full text-sm rounded border-slate-200" required/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Mulai</label><input type="time" value={editForm.data.time_start} onChange={e => editForm.setData('time_start', e.target.value)} className="w-full text-sm rounded border-slate-200" required/></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Selesai</label><input type="time" value={editForm.data.time_end} onChange={e => editForm.setData('time_end', e.target.value)} className="w-full text-sm rounded border-slate-200" required/></div>
                            </div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Ruangan</label><input type="text" value={editForm.data.room} onChange={e => editForm.setData('room', e.target.value)} className="w-full text-sm rounded border-slate-200" required/></div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setEditingSchedule(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded text-sm">Batal</button>
                                <button type="submit" disabled={editForm.processing} className="px-4 py-2 font-bold bg-blue-600 text-white rounded text-sm">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 tracking-wider mb-1 uppercase">Unified Engine</p>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Mesin Penjadwalan</h1>
                    </div>
                    {canManage && (
                        <button onClick={() => router.post(`/${currentTeam?.slug}/jadwal/generate`)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow">
                            <Play size={16} /> Generate Draft Otomatis
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800 pb-1">
                    <button onClick={() => setActiveTab('draft')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'draft' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Settings2 size={16}/> Override Draft</button>
                    <button onClick={() => setActiveTab('published')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'published' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}><CheckCircle2 size={16}/> Jadwal Resmi</button>
                    {isDosen && <button onClick={() => setActiveTab('blocks')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'blocks' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}><CalendarX size={16}/> Kalender Ketersediaan</button>}
                </div>

                {/* Konten Tab Jadwal (Draft / Published) */}
                {['draft', 'published'].includes(activeTab) && (
                    <div className="space-y-4">
                        {filteredSchedules.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl">Belum ada jadwal di fase ini.</div>
                        ) : (
                            filteredSchedules.map((sched: any) => (
                                <div key={sched?.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row gap-6 shadow-sm">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">{sched?.milestone_type}</span>
                                                <h3 className="font-bold text-lg mt-1 dark:text-white">{sched?.mahasiswa?.name}</h3>
                                            </div>
                                            {sched?.status === 'draft' && canManage && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditModal(sched)} className="text-slate-500 hover:text-blue-600 p-2 border rounded-lg transition-colors"><Edit size={16}/></button>
                                                    <button onClick={() => router.post(`/${currentTeam?.slug}/jadwal/${sched?.id}/publish`)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors px-3 py-1.5 rounded-lg text-xs font-bold">Resmikan</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 dark:bg-zinc-950 dark:border-zinc-800">
                                            <div className="flex items-center gap-2"><CalendarIcon size={14} className="text-slate-400" /> 
                                                {sched?.date ? `${sched.date} (${sched.time_start?.slice(0,5)} - ${sched.time_end?.slice(0,5)})` : <span className="text-rose-500 font-bold">Waktu Belum Di-set</span>}
                                            </div>
                                            <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {sched?.room || 'Belum Di-set'}</div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-96 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
                                        {['penguji_utama', 'penguji_pendamping', 'pembimbing'].map(role => (
                                            <div key={role} className="flex flex-col">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{role.replace('_', ' ')}</label>
                                                <select 
                                                    value={getAssigneeId(sched?.assignees, role)} 
                                                    onChange={(e) => handleAssigneeChange(sched.id, role, e.target.value)}
                                                    disabled={sched?.status !== 'draft' || !canManage}
                                                    className="w-full text-xs py-1.5 px-2 rounded bg-slate-50 border-slate-200 dark:bg-zinc-950 dark:border-zinc-700 disabled:opacity-60"
                                                >
                                                    <option value="">-- Kosong --</option>
                                                    {Array.isArray(dosens) && dosens.map((d: any) => (
                                                        <option key={d?.id} value={d?.id}>{d?.name} (W:{d?.dosen_profile?.weight_score || 1})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Konten Tab Kalender Ketersediaan (Dosen) */}
                {activeTab === 'blocks' && isDosen && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Area Kiri: Kalender */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <CalendarIcon size={18} className="text-blue-600"/> Kalender Penugasan
                                </h3>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20}/></button>
                                    <span className="font-bold text-slate-700 w-32 text-center">{monthNames[month]} {year}</span>
                                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20}/></button>
                                </div>
                            </div>
                            
                            {/* Header Hari */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                    <div key={day} className="text-xs font-bold text-slate-400 uppercase">{day}</div>
                                ))}
                            </div>
                            
                            {/* Grid Tanggal */}
                            <div className="grid grid-cols-7 gap-1">
                                {blanksArray.map((_, i) => <div key={`blank-${i}`} className="p-2 border border-transparent"></div>)}
                                
                                {daysArray.map(day => {
                                    const dateStr = formatDateStr(day);
                                    const isSelected = dateStr === selectedDateStr;
                                    const hasBlocks = getBlocksForDate(dateStr).length > 0;
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                                    return (
                                        <button 
                                            key={day} 
                                            onClick={() => handleDayClick(day)}
                                            className={`
                                                relative h-14 rounded-lg border flex flex-col items-center justify-center text-sm font-semibold transition-all
                                                ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-blue-300'}
                                                ${isToday && !isSelected ? 'text-blue-600' : ''}
                                            `}
                                        >
                                            {day}
                                            {/* Indikator Titik jika ada Blok */}
                                            {hasBlocks && (
                                                <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`}></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <p>Sistem menganggap Anda selalu <strong>tersedia</strong>. Klik tanggal pada kalender untuk menandai (mem-blok) waktu dimana Anda <strong>TIDAK BISA</strong> menguji (misal: mengajar, cuti, dinas).</p>
                            </div>
                        </div>

                        {/* Area Kanan: Form & List Blok (Untuk Tanggal Terpilih) */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col shadow-sm">
                            {!selectedDateStr ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                                    <CalendarX size={32} className="mb-2 opacity-50"/>
                                    <p className="text-sm font-medium">Pilih tanggal di kalender untuk mengatur ketersediaan Anda.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TANGGAL TERPILIH</p>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedDateStr}</h3>
                                    </div>
                                    
                                    {/* List Blok yang sudah ada */}
                                    <div className="p-5 flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950/50">
                                        <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">Daftar Halangan (Blok)</h4>
                                        {getBlocksForDate(selectedDateStr).length === 0 ? (
                                            <p className="text-xs text-slate-400 italic text-center py-4">Tidak ada halangan. Anda tersedia seharian.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {getBlocksForDate(selectedDateStr).map((b: any) => (
                                                    <div key={b.id} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-xs text-rose-600">{b.time_start.slice(0,5)} - {b.time_end.slice(0,5)}</p>
                                                            <p className="text-xs text-slate-600 mt-1">{b.reason}</p>
                                                        </div>
                                                        <button onClick={() => router.delete(`/${currentTeam?.slug}/jadwal/blocks/${b.id}`)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={14}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Form Tambah Blok */}
                                    <form onSubmit={submitBlock} className="p-5 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Mulai</label><input type="time" value={blockForm.data.time_start} onChange={e => blockForm.setData('time_start', e.target.value)} className="w-full text-xs rounded border-slate-200" required/></div>
                                            <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Selesai</label><input type="time" value={blockForm.data.time_end} onChange={e => blockForm.setData('time_end', e.target.value)} className="w-full text-xs rounded border-slate-200" required/></div>
                                        </div>
                                        <div><label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Keterangan / Alasan</label><input type="text" placeholder="Cth: Mengajar Kelas OTO-3A" value={blockForm.data.reason} onChange={e => blockForm.setData('reason', e.target.value)} className="w-full text-xs rounded border-slate-200" required/></div>
                                        <button type="submit" disabled={blockForm.processing} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs mt-2 transition-colors">Tandai Tidak Tersedia</button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Jadwal.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);