import { Head, router, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Calendar as CalendarIcon, MapPin, Settings2, CheckCircle2, 
    AlertTriangle, Play, CalendarCheck, Edit, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Jadwal & Sidang', href: '/jadwal' },
];

export default function Jadwal({ schedules = [], dosens = [], myAvailabilities = [], activeMilestoneStr, isDosen = false, roleFlags }: any) {
    const { currentTeam, auth } = usePage().props as any;
    const canManage = auth?.permissions?.includes('sidang.create') || roleFlags?.isAdmin || false;
    const [activeTab, setActiveTab] = useState('draft');
    
    const [activeMilestone, setActiveMilestone] = useState(activeMilestoneStr || 'Sempro');
    
    const [overrideData, setOverrideData] = useState<any>(null);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    const filteredSchedules = Array.isArray(schedules) 
        ? schedules.filter((s: any) => s?.status === activeTab && s?.milestone_type === activeMilestone) 
        : [];
    
    // --- LIVE CONFLICT DETECTOR (Pendeteksi Bentrok) ---
    // Memindai jadwal yang beririsan waktu pada tanggal yang sama untuk mencari dosen yang dipanggil ganda.
    const conflicts = useMemo(() => {
        const conflictSet = new Set<string>();
        const activeSchedules = (Array.isArray(schedules) ? schedules : []).filter((s:any) => s.date && s.time_start && s.time_end);
        
        for (let i = 0; i < activeSchedules.length; i++) {
            for (let j = i + 1; j < activeSchedules.length; j++) {
                const s1 = activeSchedules[i];
                const s2 = activeSchedules[j];
                
                if (s1.date === s2.date) {
                    // Cek irisan waktu (Overlap)
                    if (s1.time_start < s2.time_end && s2.time_start < s1.time_end) {
                        const uids1 = s1.assignees?.map((a:any) => a.user_id) || [];
                        const uids2 = s2.assignees?.map((a:any) => a.user_id) || [];
                        
                        // Dosen yang ada di kedua jadwal pada waktu yang beririsan
                        const common = uids1.filter((id:any) => uids2.includes(id));
                        common.forEach((uid:any) => {
                            conflictSet.add(`${s1.id}-${uid}`);
                            conflictSet.add(`${s2.id}-${uid}`);
                        });
                    }
                }
            }
        }
        return conflictSet;
    }, [schedules]);
    // ----------------------------------------------------

    const availableForm = useForm({ dates: [] as string[], year: 2026, month: 1 });
    const editForm = useForm({ date: '', time_start: '', time_end: '', room: '' });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const firstDay = new Date(year, month, 1).getDay(); 
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1; 
    
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: emptyDays }, (_, i) => i);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const formatDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    useEffect(() => {
        if (activeTab === 'availabilities' && Array.isArray(myAvailabilities)) {
            const currentMonthDates = myAvailabilities
                .filter((a: any) => {
                    const d = new Date(a.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                })
                .map((a: any) => a.date);
            setSelectedDates(currentMonthDates);
        }
    }, [year, month, myAvailabilities, activeTab]);

    const toggleDate = (dateStr: string) => {
        setSelectedDates(prev => 
            prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
        );
    };

    const submitAvailability = () => {
        router.post(`/${currentTeam?.slug}/jadwal/availabilities`, {
            dates: selectedDates,
            year: year,
            month: month + 1
        }, { preserveScroll: true });
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

    const handleGenerate = () => {
        if(confirm(`Sistem akan mengeksekusi algoritma Auto-Balancing (3 Sesi/Hari) untuk jadwal ${activeMilestone}. Lanjutkan?`)) {
            router.post(`/${currentTeam?.slug}/jadwal/generate`, {
                milestone_type: activeMilestone
            });
        }
    };

    // Daftar role dinamis untuk UI berdasarkan Milestone Type
    const getRolesForUI = () => {
        if (activeMilestone === 'Sidang') return ['penguji_utama', 'penguji_pendamping_1', 'penguji_pendamping_2', 'pembimbing_utama'];
        return ['penguji_utama', 'penguji_pendamping', 'pembimbing_utama', 'pembimbing_pendamping'];
    };

    return (
        <>
            <Head title="Mesin Penjadwalan" />

            {overrideData && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl max-w-md w-full shadow-xl border border-amber-200">
                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-full shrink-0"><AlertTriangle size={24}/></div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Peringatan Ketersediaan</h3>
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
                    
                    {['draft', 'published'].includes(activeTab) && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <select 
                                value={activeMilestone} 
                                onChange={(e) => setActiveMilestone(e.target.value)}
                                className="w-full sm:w-48 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-bold shadow-sm"
                            >
                                <option value="Sempro">Seminar Proposal</option>
                                <option value="Semhas">Seminar Hasil</option>
                                <option value="Sidang">Sidang Akhir</option>
                            </select>

                            {canManage && (
                                <button onClick={handleGenerate} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow transition-colors">
                                    <Play size={16} /> Generate Draft
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800 pb-1">
                    <button onClick={() => setActiveTab('draft')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'draft' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Settings2 size={16}/> Override Draft</button>
                    <button onClick={() => setActiveTab('published')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'published' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}><CheckCircle2 size={16}/> Jadwal Resmi</button>
                    {isDosen && <button onClick={() => setActiveTab('availabilities')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'availabilities' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><CalendarCheck size={16}/> Ketersediaan Waktu</button>}
                </div>

                {['draft', 'published'].includes(activeTab) && (
                    <div className="space-y-4">
                        {filteredSchedules.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl">
                                Belum ada jadwal {activeMilestone} di fase ini.
                            </div>
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
                                                {sched?.date ? (
                                                    <span>{sched.date} {sched.time_start && `(${sched.time_start.slice(0,5)} - ${sched.time_end?.slice(0,5)})`}</span>
                                                ) : <span className="text-rose-500 font-bold">Waktu Belum Di-set</span>}
                                            </div>
                                            <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {sched?.room || 'Belum Di-set'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-96 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 pt-4 md:pt-0 md:pl-6">
                                        {getRolesForUI().map(role => {
                                            const currentUserId = getAssigneeId(sched?.assignees, role);
                                            const isConflict = conflicts.has(`${sched.id}-${currentUserId}`);

                                            return (
                                                <div key={role} className="flex flex-col relative">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">{role.replace(/_/g, ' ')}</label>
                                                        {isConflict && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200 font-bold">⚠️ BENTROK JAM</span>}
                                                    </div>
                                                    
                                                    <select 
                                                        value={currentUserId} 
                                                        onChange={(e) => handleAssigneeChange(sched.id, role, e.target.value)}
                                                        disabled={sched?.status !== 'draft' || !canManage}
                                                        className={`w-full text-xs py-1.5 px-2 rounded disabled:opacity-60 transition-colors ${isConflict ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 dark:bg-zinc-950 dark:border-zinc-700'}`}
                                                    >
                                                        <option value="">-- Kosong --</option>
                                                        {Array.isArray(dosens) && dosens.map((d: any) => (
                                                            <option key={d?.id} value={d?.id}>{d?.name} ({d?.dosen_profile?.prodi?.code || 'XX'}) (W:{d?.dosen_profile?.weight_score || 1})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'availabilities' && isDosen && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-8 shadow-sm max-w-4xl mx-auto">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <h3 className="font-bold text-2xl text-slate-900 dark:text-white">Blok slot saya</h3>
                        </div>

                        <div className="flex justify-between items-center mb-6 text-sm">
                            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-blue-600 hover:underline font-medium">&lt; Bulan sebelumnya</button>
                            <span className="font-bold text-slate-800 text-base">{monthNames[month]} {year}</span>
                            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-blue-600 hover:underline font-medium">Bulan berikutnya &gt;</button>
                        </div>

                        <div className="grid grid-cols-7 gap-3 mb-8">
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                                <div key={day} className="text-sm font-bold text-slate-600 text-center mb-2">{day}</div>
                            ))}
                            
                            {blanksArray.map((_, i) => <div key={`blank-${i}`} />)}
                            
                            {daysArray.map(day => {
                                const dateStr = formatDateStr(day);
                                const isSelected = selectedDates.includes(dateStr);
                                return (
                                    <button 
                                        key={day}
                                        onClick={() => toggleDate(dateStr)}
                                        className={`
                                            h-14 rounded-lg border text-sm font-bold flex items-center justify-center gap-1.5 transition-all
                                            ${isSelected 
                                                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50'}
                                        `}
                                    >
                                        {isSelected && <Check size={16} strokeWidth={3} />}
                                        {day}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                            <div className="flex items-center gap-3 text-sm">
                                <button onClick={() => setSelectedDates([])} className="text-blue-600 hover:underline font-medium">Reset pilihan</button>
                                <span className="text-slate-500">· {selectedDates.length} slot dipilih</span>
                            </div>
                            <button 
                                onClick={submitAvailability} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 w-full md:w-auto justify-center transition-colors"
                            >
                                Simpan slot tersedia &rarr;
                            </button>
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