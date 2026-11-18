import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    FileCheck2,
    FolderKanban,
    MessageSquareText,
    Pencil,
    RotateCcw,
    Trash2,
    UsersRound,
    X,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Bimbingan & Logbook', href: '/bimbingan' },
];

const TOPIC_PRESETS = [
    'Penyusunan Proposal (Bab 1 - Pendahuluan)',
    'Penyusunan Proposal (Bab 2 - Tinjauan Pustaka)',
    'Penyusunan Proposal (Bab 3 - Metodologi)',
    'Revisi Pasca Seminar Proposal (Sempro)',
    'Perancangan Sistem / Desain Mekanik & Elektrik',
    'Implementasi & Pengembangan Perangkat Lunak',
    'Pengujian Alat / Pengambilan Data',
    'Penulisan Laporan Akhir (Bab 4 & Bab 5)',
    'Persiapan Sidang Tugas Akhir',
    'Revisi Pasca Sidang Tugas Akhir',
];

interface Supervisor {
    id: number;
    name: string;
    pembimbing_ke: number;
}

interface TaProjectItem {
    id: number;
    judul: string;
    tipe: string;
    status: string;
    supervisors: Supervisor[];
}

interface ProgressItem {
    lecturer_id: number;
    lecturer_name: string;
    pembimbing_ke: number;
    approved: number;
    pending: number;
    target: number;
    is_eligible: boolean;
}

interface BimbinganProps {
    isDosen: boolean;
    bimbingans: any[];
    projects: TaProjectItem[];
    students: { id: number; name: string }[];
    progressSummary: ProgressItem[] | null;
}

export default function Bimbingan({
    isDosen,
    bimbingans,
    projects,
    students,
    progressSummary,
}: BimbinganProps) {
    const { currentTeam } = usePage().props as any;

    // Filter state
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [personFilter, setPersonFilter] = useState<string>('all');

    // Mode Edit state (Mahasiswa)
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Form QoL state
    const [useManualLecturer, setUseManualLecturer] = useState(false);
    const [topicPreset, setTopicPreset] = useState<string>(TOPIC_PRESETS[0]);
    const [isCustomTopic, setIsCustomTopic] = useState(false);

    // Verifikasi state (Dosen)
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [feedbackText, setFeedbackText] = useState('');

    const defaultProject = projects[0] ?? null;
    const defaultSup = defaultProject?.supervisors[0] ?? null;

    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({
        ta_project_id: defaultProject ? String(defaultProject.id) : '',
        date: new Date().toISOString().split('T')[0],
        lecturer_id: defaultSup ? String(defaultSup.id) : '',
        lecturer_name: '',
        pembimbing_ke: defaultSup ? defaultSup.pembimbing_ke : 1,
        topic: TOPIC_PRESETS[0],
        notes: '',
        next_action: '',
    });

    const selectedProject = useMemo(
        () => projects.find((p) => String(p.id) === data.ta_project_id) ?? defaultProject,
        [projects, data.ta_project_id, defaultProject],
    );

    const availableSupervisors = selectedProject?.supervisors ?? [];

    const handleProjectChange = (projectId: string) => {
        const proj = projects.find((p) => String(p.id) === projectId);
        const firstSup = proj?.supervisors[0] ?? null;

        setData((prev) => ({
            ...prev,
            ta_project_id: projectId,
            lecturer_id: firstSup ? String(firstSup.id) : '',
            pembimbing_ke: firstSup ? firstSup.pembimbing_ke : 1,
        }));
    };

    const handleSupervisorChange = (lecturerId: string) => {
        const selected = availableSupervisors.find((s) => String(s.id) === lecturerId);
        setData((prev) => ({
            ...prev,
            lecturer_id: lecturerId,
            pembimbing_ke: selected ? selected.pembimbing_ke : 1,
        }));
    };

    const handleTopicPresetChange = (value: string) => {
        setTopicPreset(value);
        if (value === '__custom__') {
            setIsCustomTopic(true);
            setData('topic', '');
        } else {
            setIsCustomTopic(false);
            setData('topic', value);
        }
    };

    // Memulai mode edit logbook mahasiswa
    const startEditing = (item: any) => {
        clearErrors();
        setEditingItem(item);

        const isPreset = TOPIC_PRESETS.includes(item.topic);
        setIsCustomTopic(!isPreset);
        setTopicPreset(isPreset ? item.topic : '__custom__');

        const hasLecturerId = Boolean(item.lecturer_id);
        setUseManualLecturer(!hasLecturerId);

        setData({
            ta_project_id: item.ta_project_id ? String(item.ta_project_id) : (defaultProject ? String(defaultProject.id) : ''),
            date: item.date,
            lecturer_id: item.lecturer_id ? String(item.lecturer_id) : '',
            lecturer_name: item.lecturer_name ?? '',
            pembimbing_ke: item.pembimbing_ke ?? 1,
            topic: item.topic,
            notes: item.notes,
            next_action: item.next_action,
        });
    };

    // Membatalkan mode edit & kembalikan form ke default
    const cancelEditing = () => {
        clearErrors();
        setEditingItem(null);
        setIsCustomTopic(false);
        setTopicPreset(TOPIC_PRESETS[0]);
        setUseManualLecturer(false);

        setData({
            ta_project_id: defaultProject ? String(defaultProject.id) : '',
            date: new Date().toISOString().split('T')[0],
            lecturer_id: defaultSup ? String(defaultSup.id) : '',
            lecturer_name: '',
            pembimbing_ke: defaultSup ? defaultSup.pembimbing_ke : 1,
            topic: TOPIC_PRESETS[0],
            notes: '',
            next_action: '',
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editingItem) {
            put(`/${currentTeam.slug}/bimbingan/${editingItem.id}`, {
                preserveScroll: true,
                onSuccess: () => cancelEditing(),
            });
            return;
        }

        post(`/${currentTeam.slug}/bimbingan`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('notes', 'next_action');
                if (isCustomTopic) {
                    setData('topic', '');
                }
            },
        });
    };

    const handleDelete = (item: any) => {
        if (!window.confirm(`Hapus catatan bimbingan "${item.topic}" tanggal ${item.date}?`)) {
            return;
        }

        router.delete(`/${currentTeam.slug}/bimbingan/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editingItem?.id === item.id) {
                    cancelEditing();
                }
            },
        });
    };

    const handleVerify = (id: number, status: 'approved' | 'rejected') => {
        router.patch(
            `/${currentTeam.slug}/bimbingan/${id}/verify`,
            {
                status,
                lecturer_feedback: feedbackText,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setVerifyingId(null);
                    setFeedbackText('');
                },
            },
        );
    };

    const filteredBimbingans = bimbingans.filter((item) => {
        const matchStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        const matchPerson =
            personFilter === 'all'
                ? true
                : isDosen
                  ? String(item.user_id) === personFilter
                  : String(item.lecturer_id) === personFilter;
        return matchStatus && matchPerson;
    });

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Disetujui
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <XCircle size={12} /> Perlu Revisi
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <Clock3 size={12} /> Menunggu Verifikasi
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Ruang Bimbingan & Logbook" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                            {isDosen ? 'Panel Verifikasi Pembimbing' : 'Logbook Tugas Akhir'}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            {isDosen ? 'Validasi Bimbingan Mahasiswa' : 'Ruang Bimbingan & Logbook'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            {isDosen
                                ? 'Periksa dan verifikasi catatan diskusi mahasiswa bimbingan Anda sebagai syarat kelayakan sidang.'
                                : 'Dokumentasikan setiap sesi diskusi bersama dosen pembimbing (syarat minimal 8x terverifikasi per pembimbing).'}
                        </p>
                    </div>
                </div>

                {/* Banner Konteks Proyek TA Aktif (Khusus Mahasiswa) */}
                {!isDosen && (
                    <div className="rounded-xl border border-primary/20 bg-accent/50 p-5">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase">
                                        <FolderKanban size={11} /> Tema / Proyek TA Aktif
                                    </span>
                                    {selectedProject?.tipe && (
                                        <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground">
                                            Tipe {selectedProject.tipe}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-base font-bold text-foreground md:text-lg">
                                    {selectedProject
                                        ? selectedProject.judul
                                        : 'Belum ada tema / proyek TA yang ter-plotting pada akun Anda'}
                                </h2>
                                {selectedProject && availableSupervisors.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                                        {availableSupervisors.map((sup) => (
                                            <span key={sup.id} className="inline-flex items-center gap-1">
                                                <UsersRound size={13} className="text-primary" />
                                                Pembimbing {sup.pembimbing_ke}:{' '}
                                                <strong className="text-foreground">{sup.name}</strong>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar Syarat 8x Bimbingan (Khusus Mahasiswa) */}
                {!isDosen && progressSummary && progressSummary.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {progressSummary.map((prog) => {
                            const pct = Math.min(100, Math.round((prog.approved / prog.target) * 100));
                            return (
                                <div
                                    key={prog.lecturer_id}
                                    className="rounded-xl border border-border bg-card p-5 shadow-xs"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
                                                Pembimbing {prog.pembimbing_ke}
                                            </span>
                                            <h3 className="text-sm font-bold text-foreground">
                                                {prog.lecturer_name}
                                            </h3>
                                        </div>
                                        <span
                                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                                                prog.is_eligible
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-accent text-accent-foreground'
                                            }`}
                                        >
                                            {prog.approved} / {prog.target} Terverifikasi
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                prog.is_eligible ? 'bg-emerald-500' : 'bg-primary'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {prog.is_eligible
                                            ? 'Syarat minimal bimbingan terpenuhi.'
                                            : `Kurang ${prog.target - prog.approved} sesi terverifikasi lagi (${prog.pending} menunggu persetujuan).`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className={`grid grid-cols-1 gap-6 ${isDosen ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
                    {/* Daftar Riwayat Bimbingan */}
                    <div
                        className={`${
                            isDosen ? '' : 'lg:col-span-2'
                        } flex flex-col rounded-xl border border-border bg-card shadow-xs`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    RIWAYAT TERDOKUMENTASI
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Daftar Logbook ({filteredBimbingans.length})
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {!isDosen && availableSupervisors.length > 0 && (
                                    <select
                                        value={personFilter}
                                        onChange={(e) => setPersonFilter(e.target.value)}
                                        className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                    >
                                        <option value="all">Semua Pembimbing</option>
                                        {availableSupervisors.map((sup) => (
                                            <option key={sup.id} value={sup.id}>
                                                Pembimbing {sup.pembimbing_ke} ({sup.name})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {isDosen && students.length > 0 && (
                                    <select
                                        value={personFilter}
                                        onChange={(e) => setPersonFilter(e.target.value)}
                                        className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                    >
                                        <option value="all">Semua Mahasiswa</option>
                                        {students.map((mhs) => (
                                            <option key={mhs.id} value={mhs.id}>
                                                {mhs.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <div className="flex gap-1 rounded-lg bg-secondary p-1 text-xs">
                                    {(
                                        [
                                            { key: 'all', label: 'Semua' },
                                            { key: 'pending', label: 'Menunggu' },
                                            { key: 'approved', label: 'Disetujui' },
                                            { key: 'rejected', label: 'Revisi' },
                                        ] as const
                                    ).map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setStatusFilter(tab.key)}
                                            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                                statusFilter === tab.key
                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {filteredBimbingans.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    Tidak ada catatan bimbingan pada kategori ini.
                                </div>
                            ) : (
                                filteredBimbingans.map((item) => {
                                    const dateParts = item.date.split('-');
                                    const monthNames = [
                                        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                                        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
                                    ];
                                    const isBeingEdited = editingItem?.id === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex flex-col gap-4 p-5 transition-colors sm:flex-row ${
                                                isBeingEdited
                                                    ? 'bg-accent/60 ring-1 ring-inset ring-primary/40'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            {/* Kotak Tanggal */}
                                            <div className="h-min min-w-[64px] rounded-lg bg-accent p-2.5 text-center text-accent-foreground">
                                                <strong className="block text-lg leading-tight">
                                                    {dateParts[2]}
                                                </strong>
                                                <small className="text-[10px] font-bold tracking-wider uppercase">
                                                    {monthNames[parseInt(dateParts[1], 10) - 1]}
                                                </small>
                                            </div>

                                            {/* Konten Logbook */}
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div className="space-y-0.5">
                                                        {isDosen && item.user && (
                                                            <p className="text-xs font-bold text-primary">
                                                                Mahasiswa: {item.user.name}
                                                            </p>
                                                        )}
                                                        <h3 className="text-sm font-bold text-foreground">
                                                            {item.topic}
                                                        </h3>
                                                        {item.ta_project && (
                                                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                <BookOpen size={11} className="shrink-0 text-primary" />
                                                                <span className="truncate">
                                                                    Tema TA: {item.ta_project.judul}
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {renderStatusBadge(item.status)}

                                                        {/* Tombol Edit & Hapus Khusus Mahasiswa (Selama belum approved) */}
                                                        {!isDosen && item.status !== 'approved' && (
                                                            <div className="flex items-center gap-1 border-l border-border pl-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditing(item)}
                                                                    title="Edit catatan"
                                                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-primary"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(item)}
                                                                    title="Hapus catatan"
                                                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-xs leading-relaxed text-muted-foreground">
                                                    {item.notes}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-medium text-muted-foreground">
                                                    {!isDosen && (
                                                        <span className="flex items-center gap-1 font-semibold text-primary">
                                                            <UsersRound size={13} />
                                                            Pembimbing {item.pembimbing_ke}: {item.lecturer_name}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <FileCheck2 size={13} />
                                                        Tindak lanjut:{' '}
                                                        <strong className="font-medium text-foreground">
                                                            {item.next_action}
                                                        </strong>
                                                    </span>
                                                </div>

                                                {/* Catatan Feedback Dosen jika ada */}
                                                {item.lecturer_feedback && (
                                                    <div className="mt-2 rounded-lg border border-border bg-secondary/60 p-3 text-xs">
                                                        <span className="font-bold text-foreground">
                                                            Catatan Pembimbing:{' '}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {item.lecturer_feedback}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Panel Aksi Verifikasi Khusus Dosen */}
                                                {isDosen && (
                                                    <div className="pt-2">
                                                        {verifyingId === item.id ? (
                                                            <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                                                                <textarea
                                                                    rows={2}
                                                                    value={feedbackText}
                                                                    onChange={(e) =>
                                                                        setFeedbackText(e.target.value)
                                                                    }
                                                                    placeholder="Catatan / arahan tambahan untuk mahasiswa (opsional)..."
                                                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                                                                />
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleVerify(item.id, 'approved')
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                                    >
                                                                        <CheckCircle2 size={13} /> Setujui
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleVerify(item.id, 'rejected')
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                                                    >
                                                                        <RotateCcw size={13} /> Minta Revisi
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setVerifyingId(null);
                                                                            setFeedbackText('');
                                                                        }}
                                                                        className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        Batal
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setVerifyingId(item.id);
                                                                    setFeedbackText(
                                                                        item.lecturer_feedback ?? '',
                                                                    );
                                                                }}
                                                                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-primary hover:text-primary-foreground"
                                                            >
                                                                <MessageSquareText size={13} />
                                                                {item.status === 'pending'
                                                                    ? 'Verifikasi Logbook'
                                                                    : 'Ubah Status / Catatan'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Form Input / Edit Logbook (Khusus Mahasiswa) */}
                    {!isDosen && (
                        <div className="space-y-6">
                            <form
                                onSubmit={submit}
                                className={`space-y-4 rounded-xl border bg-card p-5 shadow-xs ${
                                    editingItem ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold tracking-wider text-primary uppercase">
                                            {editingItem ? 'MODE EDIT LOGBOOK' : 'DOKUMENTASI MANDIRI'}
                                        </p>
                                        <h2 className="text-base font-bold text-foreground">
                                            {editingItem ? 'Perbarui Hasil Bimbingan' : 'Catat Hasil Bimbingan'}
                                        </h2>
                                    </div>
                                    {editingItem && (
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        >
                                            <X size={13} /> Batal
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown Tema / Proyek TA jika punya lebih dari 1 */}
                                {projects.length > 0 && (
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                            Tema / Proyek TA
                                        </label>
                                        <select
                                            value={data.ta_project_id}
                                            onChange={(e) => handleProjectChange(e.target.value)}
                                            disabled={projects.length === 1}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-80"
                                        >
                                            {projects.map((proj) => (
                                                <option key={proj.id} value={proj.id}>
                                                    {proj.judul}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                        Tanggal Diskusi
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    {errors.date && (
                                        <span className="mt-1 block text-xs text-destructive">
                                            {errors.date}
                                        </span>
                                    )}
                                </div>

                                {/* Dropdown Dosen Pembimbing otomatis dari TaProject */}
                                <div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                            Dosen Pembimbing
                                        </label>
                                        {availableSupervisors.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUseManualLecturer(!useManualLecturer);
                                                    setData('lecturer_id', '');
                                                }}
                                                className="text-[11px] font-medium text-primary hover:underline"
                                            >
                                                {useManualLecturer ? 'Pilih dari plot' : 'Input manual'}
                                            </button>
                                        )}
                                    </div>

                                    {availableSupervisors.length > 0 && !useManualLecturer ? (
                                        <select
                                            value={data.lecturer_id}
                                            onChange={(e) => handleSupervisorChange(e.target.value)}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                        >
                                            {availableSupervisors.map((sup) => (
                                                <option key={sup.id} value={sup.id}>
                                                    Pembimbing {sup.pembimbing_ke} — {sup.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={data.lecturer_name}
                                            onChange={(e) => setData('lecturer_name', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="Nama Dosen Pembimbing"
                                        />
                                    )}
                                    {(errors.lecturer_id || errors.lecturer_name) && (
                                        <span className="mt-1 block text-xs text-destructive">
                                            {errors.lecturer_id || errors.lecturer_name}
                                        </span>
                                    )}
                                </div>

                                {/* Dropdown Tahapan / Topik Diskusi */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                        Tahapan / Topik Diskusi
                                    </label>
                                    <select
                                        value={topicPreset}
                                        onChange={(e) => handleTopicPresetChange(e.target.value)}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    >
                                        {TOPIC_PRESETS.map((preset) => (
                                            <option key={preset} value={preset}>
                                                {preset}
                                            </option>
                                        ))}
                                        <option value="__custom__">+ Topik Lainnya (Ketik Manual)...</option>
                                    </select>

                                    {isCustomTopic && (
                                        <input
                                            type="text"
                                            value={data.topic}
                                            onChange={(e) => setData('topic', e.target.value)}
                                            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                            placeholder="Tuliskan topik spesifik diskusi..."
                                        />
                                    )}
                                    {errors.topic && (
                                        <span className="mt-1 block text-xs text-destructive">
                                            {errors.topic}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                        Hasil & Arahan
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Tuliskan keputusan atau poin revisi..."
                                    />
                                    {errors.notes && (
                                        <span className="mt-1 block text-xs text-destructive">
                                            {errors.notes}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                        Langkah Berikutnya
                                    </label>
                                    <input
                                        type="text"
                                        value={data.next_action}
                                        onChange={(e) => setData('next_action', e.target.value)}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Target untuk pertemuan berikutnya"
                                    />
                                    {errors.next_action && (
                                        <span className="mt-1 block text-xs text-destructive">
                                            {errors.next_action}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-1">
                                    {editingItem && (
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="w-1/3 rounded-lg border border-border bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-muted"
                                        >
                                            Batal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Menyimpan...'
                                            : editingItem
                                              ? 'Simpan Perubahan'
                                              : 'Simpan Hasil Bimbingan'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Bimbingan.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;