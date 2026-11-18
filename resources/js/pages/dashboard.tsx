import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    FileCheck2,
    GraduationCap,
    Layers,
    MessageSquareText,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SIMTA',
        href: '/dashboard',
    },
    {
        title: 'Overview',
        href: '/dashboard',
    },
];

interface DashboardProps {
    roleView: 'admin' | 'dosen' | 'mahasiswa';
    todayDate: string;
    activeYearName: string;
    adminData: any;
    dosenData: any;
    studentData: any;
}

export default function Dashboard({
    roleView,
    todayDate,
    activeYearName,
    adminData,
    dosenData,
    studentData,
}: DashboardProps) {
    const { currentTeam, auth } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;

    const formatShortDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const clean = dateStr.split('T')[0];
        const parts = clean.split('-');
        if (parts.length < 3) return dateStr;
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
        return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}`;
    };

    return (
        <>
            <Head title="Overview Tugas Akhir" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 md:p-8">
                {/* Welcome Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
                    <div>
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold tracking-wider text-primary uppercase">
                                {todayDate}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                                {activeYearName}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            Selamat datang, {auth?.user?.name?.split(' ')[0] ?? 'Pengguna'}.
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {roleView === 'admin' &&
                                'Pantau distribusi judul, antrean penjadwalan ujian, dan validasi administrasi Tugas Akhir.'}
                            {roleView === 'dosen' &&
                                'Kelola validasi logbook mahasiswa bimbingan, presensi seminar, dan jadwal menguji Anda.'}
                            {roleView === 'mahasiswa' &&
                                'Monitor progres bimbingan, syarat kehadiran seminar, dan jadwal milestone Tugas Akhir Anda.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {roleView === 'admin' && (
                            <Link
                                href={`${baseUrl}/jadwal`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90"
                            >
                                <CalendarDays size={16} /> Kelola Penjadwalan
                            </Link>
                        )}
                        {roleView === 'dosen' && (
                            <Link
                                href={`${baseUrl}/bimbingan`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90"
                            >
                                <MessageSquareText size={16} /> Verifikasi Bimbingan
                            </Link>
                        )}
                        {roleView === 'mahasiswa' && (
                            <Link
                                href={`${baseUrl}/bimbingan`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90"
                            >
                                <MessageSquareText size={16} /> Catat Bimbingan
                            </Link>
                        )}
                    </div>
                </div>

                {/* ===================================================================== */}
                {/* VIEW 1: DASHBOARD MAHASISWA                                           */}
                {/* ===================================================================== */}
                {roleView === 'mahasiswa' && studentData && (
                    <>
                        {/* Banner Proyek TA Aktif */}
                        <div className="rounded-xl border border-primary/20 bg-accent/40 p-5">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                                            {studentData.project
                                                ? studentData.project.status
                                                : 'Belum Ada Judul'}
                                        </span>
                                        {studentData.project?.tipe && (
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Skema: {studentData.project.tipe}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-base font-bold text-foreground md:text-lg">
                                        {studentData.project
                                            ? studentData.project.judul
                                            : 'Anda belum memiliki judul Tugas Akhir yang ditetapkan'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {studentData.project?.pembimbings?.length > 0
                                            ? `Pembimbing: ${studentData.project.pembimbings.join(' · ')}`
                                            : 'Silakan pilih topik di Bursa Judul atau ajukan judul mandiri.'}
                                    </p>
                                </div>

                                <Link
                                    href={`${baseUrl}/tema-matchmaking`}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
                                >
                                    <BookOpen size={14} className="text-primary" />
                                    {studentData.project ? 'Detail Topik TA' : 'Ajukan / Pilih Topik'}
                                </Link>
                            </div>
                        </div>

                        {/* 4 Kartu Metrik Syarat & Jadwal */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Highlight Card: Kelayakan Sidang */}
                            <div className="flex h-36 flex-col justify-between rounded-xl bg-primary p-5 text-primary-foreground shadow-xs">
                                <div className="flex items-start justify-between">
                                    <div className="rounded-lg bg-white/15 p-2">
                                        <GraduationCap size={20} className="text-white" />
                                    </div>
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                                        Prasyarat Sidang
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {studentData.metrics.is_sidang_eligible
                                            ? 'Eligible Sidang'
                                            : 'Dalam Progres'}
                                    </h2>
                                    <p className="mt-1 text-xs text-primary-foreground/85">
                                        {studentData.metrics.is_sidang_eligible
                                            ? 'Semua syarat minimum terpenuhi'
                                            : 'Lengkapi bimbingan & presensi seminar'}
                                    </p>
                                </div>
                            </div>

                            {/* Card Bimbingan */}
                            <Link
                                href={`${baseUrl}/bimbingan`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Bimbingan Valid</p>
                                    <MessageSquareText size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {studentData.metrics.bimbingan_approved}
                                        <span className="ml-1 text-base font-normal text-muted-foreground">
                                            / {studentData.metrics.bimbingan_target} sesi
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        {studentData.metrics.bimbingan_pending} menunggu verifikasi
                                    </p>
                                </div>
                            </Link>

                            {/* Card Kehadiran Seminar */}
                            <Link
                                href={`${baseUrl}/kehadiran-seminar`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Kehadiran Seminar</p>
                                    <ClipboardCheck size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {studentData.metrics.seminar_approved}
                                        <span className="ml-1 text-base font-normal text-muted-foreground">
                                            / {studentData.metrics.seminar_target} kali
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {studentData.metrics.seminar_pending} menunggu validasi panitia
                                    </p>
                                </div>
                            </Link>

                            {/* Card Jadwal Terdekat */}
                            <Link
                                href={`${baseUrl}/jadwal`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Jadwal Terdekat</p>
                                    <CalendarDays size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {studentData.nextSchedule
                                            ? studentData.nextSchedule.milestone_type
                                            : 'Belum Ada'}
                                    </h2>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {studentData.nextSchedule
                                            ? `${studentData.nextSchedule.date} · ${studentData.nextSchedule.room}`
                                            : 'Menunggu rilis jadwal panitia'}
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Content Grid: Milestone & Bimbingan Terakhir */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Milestone Tugas Akhir */}
                            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-base font-bold text-foreground">
                                        Milestone Tugas Akhir
                                    </h2>
                                    <Link
                                        href={`${baseUrl}/pendaftaran`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Pendaftaran ujian <ArrowRight size={14} />
                                    </Link>
                                </div>

                                <div className="space-y-6">
                                    {studentData.milestones.map((step: any, idx: number) => (
                                        <div key={idx} className="relative flex gap-4">
                                            {idx < studentData.milestones.length - 1 && (
                                                <div className="absolute top-7 bottom-[-20px] left-[11px] w-[2px] bg-border" />
                                            )}

                                            <div className="relative z-10 bg-card pt-1">
                                                <div
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                                        step.done
                                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : step.current
                                                              ? 'border-primary bg-primary text-primary-foreground'
                                                              : 'border-border bg-secondary'
                                                    }`}
                                                >
                                                    {step.done ? (
                                                        <CheckCircle2 size={14} />
                                                    ) : step.current ? (
                                                        <span className="h-2 w-2 rounded-full bg-white" />
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex flex-1 items-start justify-between pb-1">
                                                <div>
                                                    <h3
                                                        className={`text-sm font-semibold ${
                                                            step.current
                                                                ? 'text-foreground'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {step.title}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {step.date}
                                                    </p>
                                                </div>
                                                {step.current && (
                                                    <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                        Tahap Aktif
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bimbingan Terakhir */}
                            <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-base font-bold text-foreground">
                                        Bimbingan Terakhir
                                    </h2>
                                    <span className="text-xs text-muted-foreground">
                                        {studentData.recentBimbingans.length} terbaru
                                    </span>
                                </div>

                                <div className="flex-1 space-y-5">
                                    {studentData.recentBimbingans.length === 0 ? (
                                        <div className="py-10 text-center text-sm text-muted-foreground">
                                            Belum ada catatan bimbingan. Mulai catat progres pertama Anda!
                                        </div>
                                    ) : (
                                        studentData.recentBimbingans.map((log: any, idx: number) => (
                                            <div key={log.id} className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                                    <MessageSquareText size={16} />
                                                </div>
                                                <div
                                                    className={`w-full ${
                                                        idx < studentData.recentBimbingans.length - 1
                                                            ? 'border-b border-border pb-4'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-sm font-bold text-foreground">
                                                            {log.topic}
                                                        </h3>
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                log.status === 'approved'
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : log.status === 'rejected'
                                                                      ? 'bg-rose-500/10 text-rose-600'
                                                                      : 'bg-amber-500/10 text-amber-600'
                                                            }`}
                                                        >
                                                            {log.status === 'approved'
                                                                ? 'Valid'
                                                                : log.status === 'rejected'
                                                                  ? 'Revisi'
                                                                  : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                        {log.notes}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                                        <Clock size={12} /> {formatShortDate(log.date)} ·{' '}
                                                        {log.lecturer_name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4 border-t border-border pt-4">
                                    <Link
                                        href={`${baseUrl}/bimbingan`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Buka ruang bimbingan <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ===================================================================== */}
                {/* VIEW 2: DASHBOARD DOSEN PEMBIMBING / PENGUJI                          */}
                {/* ===================================================================== */}
                {roleView === 'dosen' && dosenData && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex h-36 flex-col justify-between rounded-xl bg-primary p-5 text-primary-foreground shadow-xs">
                                <div className="flex items-start justify-between">
                                    <div className="rounded-lg bg-white/15 p-2">
                                        <AlertCircle size={20} className="text-white" />
                                    </div>
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                                        Perlu Validasi
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">
                                        {dosenData.metrics.pending_bimbingan}
                                    </h2>
                                    <p className="mt-1 text-xs text-primary-foreground/85">
                                        Logbook bimbingan menunggu approval
                                    </p>
                                </div>
                            </div>

                            <div className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Mahasiswa Bimbingan</p>
                                    <Users size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {dosenData.metrics.mentee_projects}
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Total {dosenData.metrics.total_bimbingan} sesi bimbingan tercatat
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`${baseUrl}/kehadiran-seminar`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Presensi Seminar</p>
                                    <ClipboardCheck size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {dosenData.metrics.pending_attendances}
                                    </h2>
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                        Daftar hadir menunggu validasi
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={`${baseUrl}/jadwal`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Jadwal Menguji</p>
                                    <CalendarDays size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {dosenData.metrics.upcoming_exams}
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sesi ujian mendatang
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Antrean Bimbingan Mahasiswa */}
                            <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-base font-bold text-foreground">
                                        Aktivitas Bimbingan Mahasiswa
                                    </h2>
                                    <Link
                                        href={`${baseUrl}/bimbingan`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Lihat semua <ArrowRight size={14} />
                                    </Link>
                                </div>

                                <div className="divide-y divide-border">
                                    {dosenData.recentBimbingans.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada catatan bimbingan masuk.
                                        </p>
                                    ) : (
                                        dosenData.recentBimbingans.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-primary">
                                                        {item.user?.name ?? 'Mahasiswa'}
                                                    </p>
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {item.topic}
                                                    </h3>
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {formatShortDate(item.date)}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        item.status === 'approved'
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-amber-500/10 text-amber-600'
                                                    }`}
                                                >
                                                    {item.status === 'approved' ? 'Tervalidasi' : 'Menunggu'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Jadwal Menguji / Membimbing */}
                            <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-base font-bold text-foreground">
                                        Jadwal Sidang & Seminar Anda
                                    </h2>
                                    <Link
                                        href={`${baseUrl}/jadwal`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Atur ketersediaan <ArrowRight size={14} />
                                    </Link>
                                </div>

                                <div className="divide-y divide-border">
                                    {dosenData.upcomingSchedules.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada jadwal ujian mendatang yang ditugaskan kepada Anda.
                                        </p>
                                    ) : (
                                        dosenData.upcomingSchedules.map((sched: any) => (
                                            <div
                                                key={sched.id}
                                                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                                            >
                                                <div>
                                                    <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                                                        {sched.milestone_type}
                                                    </span>
                                                    <h3 className="mt-1 text-sm font-bold text-foreground">
                                                        {sched.mahasiswa?.name ?? 'Mahasiswa'}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatShortDate(sched.date)} ·{' '}
                                                        {sched.room ?? 'Ruang Ujian'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ===================================================================== */}
                {/* VIEW 3: DASHBOARD PANITIA TA / ADMIN                                  */}
                {/* ===================================================================== */}
                {roleView === 'admin' && adminData && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex h-36 flex-col justify-between rounded-xl bg-primary p-5 text-primary-foreground shadow-xs">
                                <div className="flex items-start justify-between">
                                    <div className="rounded-lg bg-white/15 p-2">
                                        <GraduationCap size={20} className="text-white" />
                                    </div>
                                    <ShieldCheck size={18} className="text-primary-foreground/80" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">
                                        {adminData.metrics.total_proyek}
                                    </h2>
                                    <p className="mt-1 text-xs text-primary-foreground/85">
                                        Topik TA aktif ({adminData.metrics.proyek_draft} draft menunggu)
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`${baseUrl}/jadwal`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Jadwal Ujian</p>
                                    <CalendarDays size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {adminData.metrics.published_schedules}
                                        <span className="ml-1 text-base font-normal text-muted-foreground">
                                            rilis
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                        {adminData.metrics.draft_schedules} jadwal masih draft
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={`${baseUrl}/kehadiran-seminar`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Antrean Presensi</p>
                                    <FileCheck2 size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {adminData.metrics.pending_attendances}
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Kehadiran seminar belum divalidasi
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={`${baseUrl}/master-data`}
                                className="flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                            >
                                <div className="flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Mahasiswa TA</p>
                                    <Layers size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground">
                                        {adminData.metrics.total_mahasiswa}
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Terdaftar pada sistem akademik
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Agenda Ujian Terdekat */}
                            <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-base font-bold text-foreground">
                                        Agenda Seminar & Sidang Terdekat
                                    </h2>
                                    <Link
                                        href={`${baseUrl}/jadwal`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Kelola semua <ArrowRight size={14} />
                                    </Link>
                                </div>

                                <div className="divide-y divide-border">
                                    {adminData.upcomingSchedules.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada jadwal seminar atau sidang mendatang.
                                        </p>
                                    ) : (
                                        adminData.upcomingSchedules.map((sched: any) => (
                                            <div
                                                key={sched.id}
                                                className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                                                            {sched.milestone_type}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatShortDate(sched.date)} ·{' '}
                                                            {sched.room ?? 'Ruang Ujian'}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-1 truncate text-sm font-bold text-foreground">
                                                        {sched.mahasiswa?.name ?? 'Mahasiswa'}
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                                        sched.status === 'published'
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-amber-500/10 text-amber-600'
                                                    }`}
                                                >
                                                    {sched.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Pengajuan Judul Terbaru */}
                            <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="text-base font-bold text-foreground">
                                        Topik & Pengajuan Judul Terbaru
                                    </h2>
                                    <Link
                                        href={`${baseUrl}/tema-matchmaking`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        Bursa judul <ArrowRight size={14} />
                                    </Link>
                                </div>

                                <div className="divide-y divide-border">
                                    {adminData.recentProjects.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            Belum ada topik TA yang masuk.
                                        </p>
                                    ) : (
                                        adminData.recentProjects.map((proj: any) => (
                                            <div
                                                key={proj.id}
                                                className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                                            >
                                                <div className="min-w-0">
                                                    <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                                                        {proj.judul}
                                                    </h3>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        Pengusul: {proj.pengusul?.name ?? '-'} · Skema:{' '}
                                                        {proj.tipe}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                                                    {proj.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;