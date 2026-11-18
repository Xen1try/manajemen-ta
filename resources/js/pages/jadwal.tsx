import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Calendar as CalendarIcon,
    CalendarCheck,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    Edit,
    MapPin,
    Play,
    Search,
    Settings2,
    Sun,
    Sunrise,
    Sunset,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Jadwal & Sidang', href: '/jadwal' },
];

const SESSION_PRESETS = [
    { id: 'pagi', label: 'Sesi Pagi', start: '08:30', end: '10:00', icon: Sunrise },
    { id: 'siang', label: 'Sesi Siang', start: '10:30', end: '12:00', icon: Sun },
    { id: 'sore', label: 'Sesi Sore', start: '13:30', end: '15:00', icon: Sunset },
];

export default function Jadwal({
    schedules = [],
    dosens = [],
    myAvailabilities = [],
    activeMilestoneStr,
    isDosen = false,
    roleFlags,
    rooms = [],
}: any) {
    const { currentTeam, auth } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;
    const canManage = auth?.permissions?.includes('sidang.create') || roleFlags?.isAdmin || false;

    const [activeTab, setActiveTab] = useState<'draft' | 'published' | 'availabilities'>('draft');
    const [activeMilestone, setActiveMilestone] = useState(activeMilestoneStr || 'Sempro');
    const [searchQuery, setSearchQuery] = useState('');

    const [overrideData, setOverrideData] = useState<any>(null);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<string[]>([]);

    const filteredSchedules = useMemo(() => {
        if (!Array.isArray(schedules)) return [];
        return schedules.filter((s: any) => {
            const matchTab = s?.status === activeTab;
            const matchMilestone = s?.milestone_type === activeMilestone;
            const matchSearch =
                !searchQuery.trim() ||
                s?.mahasiswa?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s?.room?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchTab && matchMilestone && matchSearch;
        });
    }, [schedules, activeTab, activeMilestone, searchQuery]);

    // --- LIVE CONFLICT DETECTOR (Bentrok Dosen & Bentrok Ruangan) ---
    const { dosenConflicts, roomConflicts } = useMemo(() => {
        const dSet = new Set<string>();
        const rSet = new Set<number>();
        const activeSchedules = (Array.isArray(schedules) ? schedules : []).filter(
            (s: any) => s.date && s.time_start && s.time_end,
        );

        for (let i = 0; i < activeSchedules.length; i++) {
            for (let j = i + 1; j < activeSchedules.length; j++) {
                const s1 = activeSchedules[i];
                const s2 = activeSchedules[j];

                const d1 = String(s1.date).split('T')[0];
                const d2 = String(s2.date).split('T')[0];

                if (d1 === d2 && s1.time_start < s2.time_end && s2.time_start < s1.time_end) {
                    // 1. Cek bentrok dosen
                    const uids1 = s1.assignees?.map((a: any) => a.user_id) || [];
                    const uids2 = s2.assignees?.map((a: any) => a.user_id) || [];
                    const common = uids1.filter((id: any) => uids2.includes(id));
                    common.forEach((uid: any) => {
                        dSet.add(`${s1.id}-${uid}`);
                        dSet.add(`${s2.id}-${uid}`);
                    });

                    // 2. Cek bentrok ruangan
                    if (s1.room && s2.room && s1.room.toLowerCase() === s2.room.toLowerCase()) {
                        rSet.add(s1.id);
                        rSet.add(s2.id);
                    }
                }
            }
        }
        return { dosenConflicts: dSet, roomConflicts: rSet };
    }, [schedules]);

    const editForm = useForm({ date: '', time_start: '', time_end: '', room: '' });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: emptyDays }, (_, i) => i);
    const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];

    const formatDateStr = (d: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    useEffect(() => {
        if (activeTab === 'availabilities' && Array.isArray(myAvailabilities)) {
            const currentMonthDates = myAvailabilities
                .filter((a: any) => {
                    const d = new Date(a.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                })
                .map((a: any) => String(a.date).split('T')[0]);
            setSelectedDates(currentMonthDates);
        }
    }, [year, month, myAvailabilities, activeTab]);

    const toggleDate = (dateStr: string) => {
        setSelectedDates((prev) =>
            prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr],
        );
    };

    const selectAllWeekdaysInMonth = () => {
        const weekdays: string[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, month, d).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdays.push(formatDateStr(d));
            }
        }
        setSelectedDates(weekdays);
    };

    const submitAvailability = () => {
        router.post(
            `${baseUrl}/jadwal/availabilities`,
            {
                dates: selectedDates,
                year,
                month: month + 1,
            },
            { preserveScroll: true },
        );
    };

    const submitEditSchedule = (e: any) => {
        e.preventDefault();
        if (!editingSchedule?.id) return;
        editForm.put(`${baseUrl}/jadwal/${editingSchedule.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingSchedule(null),
        });
    };

    const handleAssigneeChange = (
        scheduleId: number,
        roleType: string,
        userId: string,
        force = false,
    ) => {
        if (!userId) return;
        router.post(
            `${baseUrl}/jadwal/${scheduleId}/assignee`,
            { role_type: roleType, user_id: userId, force },
            {
                preserveScroll: true,
                onError: (errors: any) => {
                    if (errors?.warning) {
                        setOverrideData({ scheduleId, roleType, userId, message: errors.message });
                    }
                },
                onSuccess: () => setOverrideData(null),
            },
        );
    };

    const openEditModal = (sched: any) => {
        if (!sched) return;
        setEditingSchedule(sched);
        editForm.setData({
            date: sched.date ? String(sched.date).split('T')[0] : '',
            time_start: sched.time_start ? sched.time_start.slice(0, 5) : '08:30',
            time_end: sched.time_end ? sched.time_end.slice(0, 5) : '10:00',
            room: sched.room || rooms[0] || '',
        });
    };

    const getAssigneeId = (assignees: any[], role: string) => {
        if (!Array.isArray(assignees)) return '';
        const found = assignees.find((a: any) => a?.role_type === role);
        return found?.user_id || '';
    };

    const handleGenerate = () => {
        if (
            confirm(
                `Sistem akan mengeksekusi algoritma Auto-Balancing (3 Sesi/Hari: Pagi, Siang, Sore) untuk jadwal ${activeMilestone}. Lanjutkan?`,
            )
        ) {
            router.post(`${baseUrl}/jadwal/generate`, {
                milestone_type: activeMilestone,
            });
        }
    };

    const handlePublishAll = () => {
        if (
            confirm(
                `Resmikan seluruh ${filteredSchedules.length} draft jadwal ${activeMilestone} sekarang?`,
            )
        ) {
            router.post(`${baseUrl}/jadwal/publish-all`, {
                milestone_type: activeMilestone,
            });
        }
    };

    const getSessionLabel = (timeStart: string | null) => {
        if (!timeStart) return null;
        const hhmm = timeStart.slice(0, 5);
        if (hhmm < '10:15') return 'Sesi Pagi';
        if (hhmm < '13:00') return 'Sesi Siang';
        return 'Sesi Sore';
    };

    const getRolesForUI = () => {
        if (activeMilestone === 'Sidang') {
            return [
                'penguji_utama',
                'penguji_pendamping_1',
                'penguji_pendamping_2',
                'pembimbing_utama',
            ];
        }
        return [
            'penguji_utama',
            'penguji_pendamping',
            'pembimbing_utama',
            'pembimbing_pendamping',
        ];
    };

    // Cek apakah dosen memiliki slot tersedia pada tanggal jadwal tertentu
    const isDosenAvailableOn = (dosen: any, dateStr: string | null) => {
        if (!dateStr || !Array.isArray(dosen?.availabilities) || dosen.availabilities.length === 0) {
            return null; // Belum mengisi kalender
        }
        const cleanDate = String(dateStr).split('T')[0];
        return dosen.availabilities.some(
            (av: any) => String(av.date).split('T')[0] === cleanDate,
        );
    };

    return (
        <>
            <Head title="Mesin Penjadwalan" />

            {/* Modal Konfirmasi Override Ketersediaan */}
            {overrideData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-xl border border-amber-500/40 bg-card p-6 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 rounded-full bg-amber-500/10 p-3 text-amber-600">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Peringatan Ketersediaan
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {overrideData.message}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setOverrideData(null)}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleAssigneeChange(
                                        overrideData.scheduleId,
                                        overrideData.roleType,
                                        overrideData.userId,
                                        true,
                                    )
                                }
                                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                            >
                                Force Override
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Waktu (Preset 3 Sesi) & Ruangan */}
            {editingSchedule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
                        <h3 className="mb-1 text-lg font-bold text-foreground">
                            Edit Waktu & Ruangan
                        </h3>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Mahasiswa: <strong>{editingSchedule.mahasiswa?.name}</strong>
                        </p>

                        <form onSubmit={submitEditSchedule} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                    Tanggal Pelaksanaan
                                </label>
                                <input
                                    type="date"
                                    value={editForm.data.date}
                                    onChange={(e) => editForm.setData('date', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    required
                                />
                            </div>

                            {/* Preset 3 Sesi Cepat */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                                    Pilih Sesi Standar (3 Sesi/Hari)
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SESSION_PRESETS.map((preset) => {
                                        const Icon = preset.icon;
                                        const isActive =
                                            editForm.data.time_start === preset.start &&
                                            editForm.data.time_end === preset.end;

                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() =>
                                                    editForm.setData((prev) => ({
                                                        ...prev,
                                                        time_start: preset.start,
                                                        time_end: preset.end,
                                                    }))
                                                }
                                                className={`flex flex-col items-center rounded-lg border p-2 text-xs transition ${
                                                    isActive
                                                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                                                        : 'border-border bg-background text-foreground hover:border-primary/50'
                                                }`}
                                            >
                                                <Icon size={14} className="mb-1" />
                                                <span>{preset.label}</span>
                                                <span className="text-[10px] opacity-80">
                                                    {preset.start}–{preset.end}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                        Jam Mulai
                                    </label>
                                    <input
                                        type="time"
                                        value={editForm.data.time_start}
                                        onChange={(e) =>
                                            editForm.setData('time_start', e.target.value)
                                        }
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                        Jam Selesai
                                    </label>
                                    <input
                                        type="time"
                                        value={editForm.data.time_end}
                                        onChange={(e) =>
                                            editForm.setData('time_end', e.target.value)
                                        }
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                    Ruangan Ujian
                                </label>
                                <input
                                    type="text"
                                    list="room-options"
                                    value={editForm.data.room}
                                    onChange={(e) => editForm.setData('room', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    required
                                />
                                <datalist id="room-options">
                                    {rooms.map((r: string) => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSchedule(null)}
                                    className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                            Unified Scheduling Engine · 3 Sesi/Hari
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            Mesin Penjadwalan
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Distribusi otomatis Sesi Pagi (08:30), Siang (10:30), dan Sore (13:30) berdasarkan ketersediaan hari dosen.
                        </p>
                    </div>

                    {['draft', 'published'].includes(activeTab) && (
                        <div className="flex w-full flex-col items-center gap-2.5 sm:flex-row md:w-auto">
                            <select
                                value={activeMilestone}
                                onChange={(e) => setActiveMilestone(e.target.value)}
                                className="block w-full rounded-lg border border-input bg-card p-2.5 text-sm font-bold text-foreground shadow-xs sm:w-48"
                            >
                                <option value="Sempro">Seminar Proposal</option>
                                <option value="Semhas">Seminar Hasil</option>
                                <option value="Sidang">Sidang Akhir</option>
                            </select>

                            {canManage && activeTab === 'draft' && (
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90 sm:w-auto"
                                >
                                    <Play size={16} /> Generate Draft
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Tab Navigasi */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-2">
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('draft')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                activeTab === 'draft'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                        >
                            <Settings2 size={15} /> Override Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('published')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                activeTab === 'published'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                        >
                            <CheckCircle2 size={15} /> Jadwal Resmi
                        </button>
                        {isDosen && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('availabilities')}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                    activeTab === 'availabilities'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                            >
                                <CalendarCheck size={15} /> Ketersediaan Hari Saya
                            </button>
                        )}
                    </div>

                    {/* Search & Bulk Publish */}
                    {['draft', 'published'].includes(activeTab) && (
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari mahasiswa / ruangan..."
                                    className="rounded-lg border border-input bg-background py-1.5 pr-3 pl-8 text-xs text-foreground"
                                />
                            </div>

                            {canManage && activeTab === 'draft' && filteredSchedules.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handlePublishAll}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                                >
                                    <CheckCheck size={14} /> Resmikan Semua ({filteredSchedules.length})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ===================================================================== */}
                {/* LIST JADWAL (DRAFT & PUBLISHED)                                       */}
                {/* ===================================================================== */}
                {['draft', 'published'].includes(activeTab) && (
                    <div className="space-y-4">
                        {filteredSchedules.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                                Belum ada jadwal {activeMilestone} pada tab ini.
                            </div>
                        ) : (
                            filteredSchedules.map((sched: any) => {
                                const isRoomConflict = roomConflicts.has(sched.id);
                                const sessionLabel = getSessionLabel(sched.time_start);
                                const cleanDate = sched?.date ? String(sched.date).split('T')[0] : null;

                                return (
                                    <div
                                        key={sched?.id}
                                        className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 shadow-xs md:flex-row"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-3 flex items-start justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                                                            {sched?.milestone_type}
                                                        </span>
                                                        {sessionLabel && (
                                                            <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                                                                {sessionLabel}
                                                            </span>
                                                        )}
                                                        {isRoomConflict && (
                                                            <span className="rounded border border-rose-300 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                                                ⚠️ BENTROK RUANGAN
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="mt-1.5 text-lg font-bold text-foreground">
                                                        {sched?.mahasiswa?.name}
                                                    </h3>
                                                </div>

                                                {sched?.status === 'draft' && canManage && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(sched)}
                                                            title="Ubah sesi/tanggal/ruangan"
                                                            className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.post(
                                                                    `${baseUrl}/jadwal/${sched?.id}/publish`,
                                                                )
                                                            }
                                                            className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-600 hover:text-white dark:text-emerald-400"
                                                        >
                                                            Resmikan
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-secondary/40 p-3.5 text-xs font-medium text-foreground sm:grid-cols-2">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon size={14} className="text-primary" />
                                                    {cleanDate ? (
                                                        <span>
                                                            {cleanDate}{' '}
                                                            {sched.time_start &&
                                                                `(${sched.time_start.slice(0, 5)} – ${sched.time_end?.slice(0, 5)})`}
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold text-rose-500">
                                                            Waktu Belum Di-set
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    className={`flex items-center gap-2 ${
                                                        isRoomConflict ? 'font-bold text-rose-600' : ''
                                                    }`}
                                                >
                                                    <MapPin size={14} className="text-primary" />
                                                    <span>{sched?.room || 'Ruangan Belum Di-set'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Panel Tim Penguji & Pembimbing */}
                                        <div className="flex w-full flex-col gap-2.5 border-t border-border pt-4 md:w-96 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                                            {getRolesForUI().map((role) => {
                                                const currentUserId = getAssigneeId(
                                                    sched?.assignees,
                                                    role,
                                                );
                                                const isConflict = dosenConflicts.has(
                                                    `${sched.id}-${currentUserId}`,
                                                );

                                                return (
                                                    <div key={role} className="flex flex-col">
                                                        <div className="mb-0.5 flex items-center justify-between">
                                                            <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                                {role.replace(/_/g, ' ')}
                                                            </label>
                                                            {isConflict && (
                                                                <span className="rounded border border-amber-300 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                                                                    ⚠️ BENTROK SESI
                                                                </span>
                                                            )}
                                                        </div>

                                                        <select
                                                            value={currentUserId}
                                                            onChange={(e) =>
                                                                handleAssigneeChange(
                                                                    sched.id,
                                                                    role,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={
                                                                sched?.status !== 'draft' || !canManage
                                                            }
                                                            className={`w-full rounded-lg border px-2.5 py-1.5 text-xs transition disabled:opacity-70 ${
                                                                isConflict
                                                                    ? 'border-amber-400 bg-amber-500/10 text-foreground'
                                                                    : 'border-input bg-background text-foreground'
                                                            }`}
                                                        >
                                                            <option value="">-- Kosong --</option>
                                                            {Array.isArray(dosens) &&
                                                                dosens.map((d: any) => {
                                                                    const availStatus = isDosenAvailableOn(
                                                                        d,
                                                                        cleanDate,
                                                                    );
                                                                    const availTag =
                                                                        availStatus === true
                                                                            ? '✓ Tersedia'
                                                                            : availStatus === false
                                                                              ? '✗ Di luar slot'
                                                                              : '';

                                                                    return (
                                                                        <option key={d?.id} value={d?.id}>
                                                                            {d?.name} (
                                                                            {d?.dosen_profile?.prodi
                                                                                ?.code || 'XX'}
                                                                            ){' '}
                                                                            {availTag
                                                                                ? `· ${availTag}`
                                                                                : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                        </select>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ===================================================================== */}
                {/* KALENDER KETERSEDIAAN HARI DOSEN                                      */}
                {/* ===================================================================== */}
                {activeTab === 'availabilities' && isDosen && (
                    <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-6 shadow-xs md:p-8">
                        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">
                                    Ketersediaan Hari Menguji & Seminar
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pilih tanggal-tanggal di mana Anda bersedia dijadwalkan (mencakup hingga 3 sesi harian: Pagi, Siang, Sore).
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={selectAllWeekdaysInMonth}
                                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-muted"
                            >
                                Pilih Semua Hari Kerja (Sen–Jum)
                            </button>
                        </div>

                        <div className="mb-6 flex items-center justify-between text-sm">
                            <button
                                type="button"
                                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                                className="font-semibold text-primary hover:underline"
                            >
                                &lt; Bulan sebelumnya
                            </button>
                            <span className="text-base font-bold text-foreground">
                                {monthNames[month]} {year}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                                className="font-semibold text-primary hover:underline"
                            >
                                Bulan berikutnya &gt;
                            </button>
                        </div>

                        <div className="mb-8 grid grid-cols-7 gap-2.5">
                            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                                <div
                                    key={day}
                                    className="mb-1 text-center text-xs font-bold text-muted-foreground"
                                >
                                    {day}
                                </div>
                            ))}

                            {blanksArray.map((_, i) => (
                                <div key={`blank-${i}`} />
                            ))}

                            {daysArray.map((day) => {
                                const dateStr = formatDateStr(day);
                                const isSelected = selectedDates.includes(dateStr);
                                const dayOfWeek = new Date(year, month, day).getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDate(dateStr)}
                                        className={`flex h-13 items-center justify-center gap-1.5 rounded-lg border text-sm font-bold transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                : isWeekend
                                                  ? 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40'
                                                  : 'border-border bg-background text-foreground hover:border-primary/60 hover:bg-accent/50'
                                        }`}
                                    >
                                        {isSelected && <Check size={15} strokeWidth={3} />}
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
                            <div className="flex items-center gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDates([])}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Reset pilihan
                                </button>
                                <span className="text-muted-foreground">
                                    · {selectedDates.length} hari tersedia dipilih
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={submitAvailability}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 md:w-auto"
                            >
                                Simpan Ketersediaan Hari &rarr;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Jadwal.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;