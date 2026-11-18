import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileText,
    MapPin,
    MessageSquareText,
    Pencil,
    RotateCcw,
    Save,
    Search,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Kehadiran Seminar', href: '/kehadiran-seminar' },
];

interface StudentOption {
    id: number;
    name: string;
    email: string;
}

interface SeminarSession {
    id: number;
    milestone_type: 'Sempro' | 'Semhas';
    seminar_title: string;
    date: string | null;
    location: string;
    status: string;
    attendees: any[];
}

interface SummaryMetrics {
    approved: number;
    pending: number;
    total: number;
    target: number;
    is_eligible: boolean;
    last_date: string | null;
}

interface Props {
    isVerifier: boolean;
    myAttendances: any[];
    mySeminars: SeminarSession[];
    eligibleStudents: StudentOption[];
    attendances: any[];
    students: { id: number; name: string }[];
    summary: SummaryMetrics | null;
}

export default function KehadiranSeminar({
    isVerifier,
    myAttendances,
    mySeminars,
    eligibleStudents,
    attendances,
    students,
    summary,
}: Props) {
    const { currentTeam } = usePage().props as any;

    // Tab Mahasiswa: 'peserta' (Read-only riwayat hadir) vs 'penyaji' (CRUD daftar hadir seminar sendiri)
    const [activeTab, setActiveTab] = useState<'peserta' | 'penyaji'>('peserta');

    // State Tab Penyaji
    const [selectedSeminarId, setSelectedSeminarId] = useState<string>(
        mySeminars[0] ? String(mySeminars[0].id) : '',
    );
    const [studentSearch, setStudentSearch] = useState('');

    // State Inline Edit (Update Peserta oleh Pemilik Seminar)
    const [editingAttendeeId, setEditingAttendeeId] = useState<number | null>(null);
    const [editUserId, setEditUserId] = useState<string>('');
    const [editSummary, setEditSummary] = useState<string>('');

    // State Filter Verifier & Peserta
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [studentFilter, setStudentFilter] = useState<string>('all');
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [verifierNotes, setVerifierNotes] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        milestone_schedule_id: mySeminars[0] ? String(mySeminars[0].id) : '',
        attendee_ids: [] as number[],
        notes: '',
    });

    const activeSeminar = useMemo(
        () => mySeminars.find((s) => String(s.id) === selectedSeminarId) ?? mySeminars[0] ?? null,
        [mySeminars, selectedSeminarId],
    );

    const alreadyRecordedIds = useMemo(
        () => new Set((activeSeminar?.attendees ?? []).map((a: any) => Number(a.user_id))),
        [activeSeminar],
    );

    const filteredCandidateStudents = useMemo(() => {
        return eligibleStudents.filter(
            (s) =>
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.email.toLowerCase().includes(studentSearch.toLowerCase()),
        );
    }, [eligibleStudents, studentSearch]);

    const toggleAttendeeSelection = (studentId: number) => {
        if (alreadyRecordedIds.has(studentId)) return;

        const exists = data.attendee_ids.includes(studentId);
        if (exists) {
            setData(
                'attendee_ids',
                data.attendee_ids.filter((id) => id !== studentId),
            );
        } else {
            setData('attendee_ids', [...data.attendee_ids, studentId]);
        }
    };

    const handleSeminarSwitch = (seminarId: string) => {
        setSelectedSeminarId(seminarId);
        setEditingAttendeeId(null);
        setData((prev) => ({
            ...prev,
            milestone_schedule_id: seminarId,
            attendee_ids: [],
        }));
    };

    const submitAttendees: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeSeminar || data.attendee_ids.length === 0) return;

        post(`/${currentTeam.slug}/kehadiran-seminar/record-attendees`, {
            preserveScroll: true,
            onSuccess: () => {
                setData((prev) => ({
                    ...prev,
                    attendee_ids: [],
                    notes: '',
                }));
            },
        });
    };

    // Mulai Edit Peserta (Update)
    const startEditAttendee = (att: any) => {
        setEditingAttendeeId(att.id);
        setEditUserId(String(att.user_id));
        setEditSummary(att.summary ?? '');
    };

    const cancelEditAttendee = () => {
        setEditingAttendeeId(null);
        setEditUserId('');
        setEditSummary('');
    };

    const saveEditAttendee = (attendanceId: number) => {
        router.put(
            `/${currentTeam.slug}/kehadiran-seminar/${attendanceId}`,
            {
                user_id: editUserId,
                summary: editSummary,
            },
            {
                preserveScroll: true,
                onSuccess: () => cancelEditAttendee(),
            },
        );
    };

    // Hapus Peserta (Delete)
    const handleRemoveAttendee = (attendanceId: number, studentName: string) => {
        if (!window.confirm(`Hapus ${studentName} dari daftar hadir seminar Anda?`)) return;

        router.delete(`/${currentTeam.slug}/kehadiran-seminar/${attendanceId}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editingAttendeeId === attendanceId) {
                    cancelEditAttendee();
                }
            },
        });
    };

    // Verifikasi oleh Dosen / Panitia
    const handleVerify = (id: number, status: 'approved' | 'rejected') => {
        router.patch(
            `/${currentTeam.slug}/kehadiran-seminar/${id}/verify`,
            {
                status,
                verifier_notes: verifierNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setVerifyingId(null);
                    setVerifierNotes('');
                },
            },
        );
    };

    const formatShortDate = (dateStr: string | null) => {
        if (!dateStr) return 'Belum dijadwalkan';
        const parts = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> Terverifikasi
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <XCircle size={12} /> Ditolak
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

    const listSource = isVerifier ? attendances : myAttendances;
    const filteredList = listSource.filter((item) => {
        const matchStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        const matchStudent =
            !isVerifier || studentFilter === 'all' ? true : String(item.user_id) === studentFilter;
        return matchStatus && matchStudent;
    });

    const progressPct = summary ? Math.min(100, Math.round((summary.approved / summary.target) * 100)) : 0;

    return (
        <>
            <Head title="Kehadiran Seminar Tugas Akhir" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                            {isVerifier ? 'Panel Validasi Panitia & Dosen' : 'Presensi Seminar Tugas Akhir'}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            {isVerifier ? 'Verifikasi Daftar Hadir Seminar' : 'Kehadiran Seminar'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            {isVerifier
                                ? 'Validasi daftar kehadiran peserta seminar yang didata oleh mahasiswa penyaji.'
                                : 'Lihat riwayat seminar yang sudah Anda hadiri (min. 5x) atau kelola daftar peserta yang hadir pada seminar Anda.'}
                        </p>
                    </div>

                    {/* Switcher Mode Mahasiswa: Peserta (R) vs Penyaji Seminar (CRUD) */}
                    {!isVerifier && (
                        <div className="flex gap-1.5 rounded-xl border border-border bg-secondary p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('peserta')}
                                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                    activeTab === 'peserta'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <ClipboardCheck size={14} />
                                Kehadiran Saya ({myAttendances.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('penyaji')}
                                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                                    activeTab === 'penyaji'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Users size={14} />
                                Kelola Daftar Hadir Seminar Saya ({mySeminars.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* ===================================================================== */}
                {/* TAB 1 (PESERTA READ-ONLY / VERIFIER): RIWAYAT KEHADIRAN SEMINAR       */}
                {/* ===================================================================== */}
                {(isVerifier || activeTab === 'peserta') && (
                    <>
                        {!isVerifier && summary && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-xl bg-primary p-5 text-primary-foreground shadow-xs">
                                    <div className="mb-2 flex items-start justify-between">
                                        <p className="text-xs font-medium text-primary-foreground/85">
                                            Presensi Terverifikasi
                                        </p>
                                        <ClipboardCheck size={18} className="text-primary-foreground/80" />
                                    </div>
                                    <h2 className="mb-2 text-3xl font-bold">
                                        {summary.approved}{' '}
                                        <span className="text-sm font-normal text-primary-foreground/75">
                                            / {summary.target}
                                        </span>
                                    </h2>
                                    <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                                        <div
                                            className="h-full rounded-full bg-white transition-all duration-500"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-primary-foreground/90">
                                        {summary.is_eligible
                                            ? 'Syarat minimum 5 kehadiran terpenuhi'
                                            : `Kurang ${summary.target - summary.approved} kehadiran terverifikasi lagi`}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                    <div className="mb-2 flex items-start justify-between text-muted-foreground">
                                        <p className="text-sm font-medium">Total Seminar Dihadiri</p>
                                        <CalendarDays size={18} className="text-primary" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground">{summary.total}</h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {summary.pending} menunggu verifikasi dosen/panitia
                                    </p>
                                </div>

                                <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                    <div className="mb-2 flex items-start justify-between text-muted-foreground">
                                        <p className="text-sm font-medium">Kehadiran Terakhir</p>
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {formatShortDate(summary.last_date)}
                                    </h2>
                                    <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        {summary.is_eligible ? 'Status: Eligible Sidang' : 'Status: Dalam Progres'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Daftar Seminar yang Sudah Dihadiri */}
                        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        {isVerifier ? 'ANTREAN VALIDASI' : 'RIWAYAT KEHADIRAN ANDA'}
                                    </p>
                                    <h2 className="text-lg font-bold text-foreground">
                                        {isVerifier
                                            ? `Daftar Kehadiran Seminar (${filteredList.length})`
                                            : `Seminar yang Sudah Anda Hadiri (${filteredList.length})`}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {isVerifier && students.length > 0 && (
                                        <select
                                            value={studentFilter}
                                            onChange={(e) => setStudentFilter(e.target.value)}
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
                                                { key: 'approved', label: 'Terverifikasi' },
                                                { key: 'rejected', label: 'Ditolak' },
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
                                {filteredList.length === 0 ? (
                                    <div className="p-10 text-center text-sm text-muted-foreground">
                                        {isVerifier
                                            ? 'Belum ada data kehadiran seminar pada kategori ini.'
                                            : 'Anda belum tercatat hadir di seminar mana pun. Data kehadiran akan tampil di sini setelah dicatat oleh mahasiswa pemilik seminar.'}
                                    </div>
                                ) : (
                                    filteredList.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                                                    <div
                                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                            item.status === 'approved'
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-accent text-accent-foreground'
                                                        }`}
                                                    >
                                                        {item.milestone_type === 'Semhas' ? 'SH' : 'SP'}
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        {isVerifier && item.user && (
                                                            <p className="text-xs font-bold text-primary">
                                                                Peserta Hadir: {item.user.name}
                                                            </p>
                                                        )}
                                                        <h3 className="text-sm font-bold text-foreground">
                                                            {item.seminar_title}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
                                                                <UserCheck size={12} className="text-primary" />
                                                                Penyaji: {item.presenter_name}
                                                            </span>
                                                            <span>·</span>
                                                            <span>{formatShortDate(item.date)}</span>
                                                            {item.location && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <MapPin size={12} /> {item.location}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>{renderStatusBadge(item.status)}</div>
                                            </div>

                                            {item.summary && (
                                                <p className="pl-12 text-xs text-muted-foreground">
                                                    <FileText size={12} className="mr-1 inline text-primary" />
                                                    Keterangan: {item.summary}
                                                </p>
                                            )}

                                            {item.verifier_notes && (
                                                <div className="ml-12 rounded-lg border border-border bg-secondary/60 p-2.5 text-xs">
                                                    <span className="font-bold text-foreground">
                                                        Catatan Verifikator:{' '}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {item.verifier_notes}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Panel Verifikasi Khusus Dosen / Panitia */}
                                            {isVerifier && (
                                                <div className="pl-12 pt-1">
                                                    {verifyingId === item.id ? (
                                                        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                                                            <textarea
                                                                rows={2}
                                                                value={verifierNotes}
                                                                onChange={(e) =>
                                                                    setVerifierNotes(e.target.value)
                                                                }
                                                                placeholder="Catatan verifikasi (opsional)..."
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
                                                                    <CheckCircle2 size={13} /> Validasi Hadir
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleVerify(item.id, 'rejected')
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                                                >
                                                                    <RotateCcw size={13} /> Tolak
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVerifyingId(null);
                                                                        setVerifierNotes('');
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
                                                                setVerifierNotes(
                                                                    item.verifier_notes ?? '',
                                                                );
                                                            }}
                                                            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-primary hover:text-primary-foreground"
                                                        >
                                                            <MessageSquareText size={13} />
                                                            {item.status === 'pending'
                                                                ? 'Verifikasi Kehadiran'
                                                                : 'Ubah Status'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ===================================================================== */}
                {/* TAB 2 (CRUD PENYAJI): KELOLA DAFTAR HADIR SEMINAR MILIK SENDIRI       */}
                {/* ===================================================================== */}
                {!isVerifier && activeTab === 'penyaji' && (
                    <>
                        {mySeminars.length === 0 ? (
                            <div className="rounded-xl border border-border bg-card p-10 text-center">
                                <Users size={32} className="mx-auto mb-3 text-muted-foreground" />
                                <h3 className="text-base font-bold text-foreground">
                                    Belum Ada Jadwal Seminar Anda
                                </h3>
                                <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                                    Fitur pendataan peserta seminar akan aktif otomatis setelah jadwal Seminar Proposal (Sempro) atau Seminar Hasil (Semhas) Anda dibuat oleh Panitia TA.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                {/* Kiri: Daftar Peserta yang Sudah Tercatat (Read, Update, Delete) */}
                                <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
                                    <div className="border-b border-border p-5">
                                        {mySeminars.length > 1 && (
                                            <div className="mb-4">
                                                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                                    Pilih Sesi Seminar Anda
                                                </label>
                                                <select
                                                    value={selectedSeminarId}
                                                    onChange={(e) => handleSeminarSwitch(e.target.value)}
                                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                >
                                                    {mySeminars.map((sem) => (
                                                        <option key={sem.id} value={sem.id}>
                                                            [{sem.milestone_type}] {formatShortDate(sem.date)} —{' '}
                                                            {sem.seminar_title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {activeSeminar && (
                                            <div className="rounded-lg border border-primary/20 bg-accent/50 p-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                                                        {activeSeminar.milestone_type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatShortDate(activeSeminar.date)} ·{' '}
                                                        {activeSeminar.location}
                                                    </span>
                                                </div>
                                                <h2 className="mt-1 text-base font-bold text-foreground">
                                                    {activeSeminar.seminar_title}
                                                </h2>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Total peserta terdata:{' '}
                                                    <strong className="text-foreground">
                                                        {activeSeminar.attendees.length} mahasiswa
                                                    </strong>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="divide-y divide-border">
                                        {(activeSeminar?.attendees ?? []).length === 0 ? (
                                            <div className="p-10 text-center text-sm text-muted-foreground">
                                                Belum ada peserta yang didata pada daftar hadir seminar ini.
                                            </div>
                                        ) : (
                                            activeSeminar?.attendees.map((att: any) => {
                                                const isEditing = editingAttendeeId === att.id;

                                                return (
                                                    <div
                                                        key={att.id}
                                                        className={`p-4 transition-colors ${
                                                            isEditing ? 'bg-accent/60' : 'hover:bg-muted/40'
                                                        }`}
                                                    >
                                                        {isEditing ? (
                                                            /* Inline Form Update Peserta */
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                    <div>
                                                                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                                                                            Mahasiswa Peserta
                                                                        </label>
                                                                        <select
                                                                            value={editUserId}
                                                                            onChange={(e) =>
                                                                                setEditUserId(e.target.value)
                                                                            }
                                                                            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                                                        >
                                                                            {eligibleStudents.map((st) => (
                                                                                <option key={st.id} value={st.id}>
                                                                                    {st.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                                                                            Keterangan / Peran Peserta
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={editSummary}
                                                                            onChange={(e) =>
                                                                                setEditSummary(e.target.value)
                                                                            }
                                                                            placeholder="Misal: Peserta Aktif / Penanya"
                                                                            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => saveEditAttendee(att.id)}
                                                                        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                                                                    >
                                                                        <Save size={12} /> Simpan Perubahan
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={cancelEditAttendee}
                                                                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <X size={12} /> Batal
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Tampilan Normal Item Peserta */
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-bold text-foreground">
                                                                        {att.user?.name ?? 'Mahasiswa'}
                                                                    </p>
                                                                    <p className="truncate text-xs text-muted-foreground">
                                                                        {att.summary || att.user?.email}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {renderStatusBadge(att.status)}

                                                                    {att.status !== 'approved' && (
                                                                        <div className="flex items-center gap-1 border-l border-border pl-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    startEditAttendee(att)
                                                                                }
                                                                                title="Edit data peserta"
                                                                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-primary"
                                                                            >
                                                                                <Pencil size={14} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleRemoveAttendee(
                                                                                        att.id,
                                                                                        att.user?.name ??
                                                                                            'peserta',
                                                                                    )
                                                                                }
                                                                                title="Hapus dari daftar hadir"
                                                                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Kanan: Form Create Tambah Peserta Hadir */}
                                <div>
                                    <form
                                        onSubmit={submitAttendees}
                                        className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs"
                                    >
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-wider text-primary uppercase">
                                                TAMBAH DATA KEHADIRAN
                                            </p>
                                            <h2 className="text-base font-bold text-foreground">
                                                Pendataan Mahasiswa Hadir
                                            </h2>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Pilih satu atau beberapa mahasiswa yang menghadiri seminar Anda.
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <Search
                                                size={14}
                                                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                            />
                                            <input
                                                type="text"
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                placeholder="Cari nama atau email mahasiswa..."
                                                className="w-full rounded-lg border border-input bg-background py-2 pr-3 pl-8 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                            />
                                        </div>

                                        <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-input bg-background">
                                            {filteredCandidateStudents.length === 0 ? (
                                                <p className="p-4 text-center text-xs text-muted-foreground">
                                                    Mahasiswa tidak ditemukan.
                                                </p>
                                            ) : (
                                                filteredCandidateStudents.map((mhs) => {
                                                    const isRecorded = alreadyRecordedIds.has(Number(mhs.id));
                                                    const isChecked = data.attendee_ids.includes(Number(mhs.id));

                                                    return (
                                                        <label
                                                            key={mhs.id}
                                                            className={`flex cursor-pointer items-center justify-between gap-2 p-2.5 text-xs transition ${
                                                                isRecorded
                                                                    ? 'cursor-not-allowed bg-muted/50 opacity-60'
                                                                    : isChecked
                                                                      ? 'bg-accent/70'
                                                                      : 'hover:bg-muted/40'
                                                            }`}
                                                        >
                                                            <div className="flex min-w-0 items-center gap-2.5">
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={isRecorded}
                                                                    checked={isRecorded || isChecked}
                                                                    onChange={() =>
                                                                        toggleAttendeeSelection(Number(mhs.id))
                                                                    }
                                                                    className="rounded border-input text-primary focus:ring-primary"
                                                                />
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-semibold text-foreground">
                                                                        {mhs.name}
                                                                    </p>
                                                                    <p className="truncate text-[10px] text-muted-foreground">
                                                                        {mhs.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {isRecorded && (
                                                                <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                                                                    Terdata
                                                                </span>
                                                            )}
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {errors.attendee_ids && (
                                            <span className="block text-xs text-destructive">
                                                {errors.attendee_ids}
                                            </span>
                                        )}

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                                Keterangan Kehadiran (Opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Misal: Hadir penuh sesi pagi / Penanya"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing || data.attendee_ids.length === 0}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                                        >
                                            <UserPlus size={16} />
                                            {processing
                                                ? 'Menyimpan...'
                                                : `Tambahkan Peserta (${data.attendee_ids.length})`}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

KehadiranSeminar.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;