import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
    FileText,
    Link as LinkIcon,
    MessageSquareText,
    RotateCcw,
    Send,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Pendaftaran Seminar & Sidang', href: '/pendaftaran' },
];

export default function PendaftaranSidang({
    isApprover = false,
    registrations = {},
    pendingList = [],
    stats = {},
}: any) {
    const { currentTeam } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;

    const [activeTab, setActiveTab] = useState<'Sempro' | 'Semhas' | 'Sidang'>('Sempro');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending_pembimbing' | 'approved' | 'rejected'>('all');
    const [reviewingId, setReviewingId] = useState<number | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');

    const regData = registrations?.[activeTab];

    const getDefaultKtiLink = (type: string) => {
        if (regData?.dokumen_kti_link) return regData.dokumen_kti_link;
        if (type === 'Sempro') return stats?.docs_status?.proposal_url || '';
        if (type === 'Semhas') return stats?.docs_status?.laporan_semhas_url || '';
        return stats?.docs_status?.laporan_akhir_url || '';
    };

    const form = useForm({
        milestone_type: activeTab,
        dokumen_kti_link: getDefaultKtiLink(activeTab),
        dokumen_produk_link: regData?.dokumen_produk_link || stats?.docs_status?.produk_url || '',
        bukti_pembayaran_link: regData?.bukti_pembayaran_link || '',
        persentase_produk: activeTab === 'Sidang' ? 100 : 80,
        persentase_kti: activeTab === 'Sidang' ? 100 : 80,
    });

    useEffect(() => {
        const currentReg = registrations?.[activeTab];
        form.setData({
            milestone_type: activeTab,
            dokumen_kti_link: currentReg?.dokumen_kti_link || getDefaultKtiLink(activeTab),
            dokumen_produk_link: currentReg?.dokumen_produk_link || stats?.docs_status?.produk_url || '',
            bukti_pembayaran_link: currentReg?.bukti_pembayaran_link || '',
            persentase_produk: activeTab === 'Sidang' ? 100 : 80,
            persentase_kti: activeTab === 'Sidang' ? 100 : 80,
        });
    }, [activeTab]);

    // Evaluasi Prasyarat Riil dari Database
    const getCriteria = (type: string) => {
        const hasPembimbing2 = stats?.has_pembimbing_2 ?? true;
        const b1 = stats?.bimbingan_utama ?? 0;
        const b2 = stats?.bimbingan_pendamping ?? 0;
        const semCount = stats?.kehadiran_seminar ?? 0;
        const ithScore = stats?.ithenticate_score;

        if (type === 'Sidang') {
            return [
                {
                    label: 'Telah menyelesaikan & lulus Seminar Hasil (Semhas)',
                    met: registrations?.['Semhas']?.status === 'approved',
                    actionHref: null,
                },
                {
                    label: `Kehadiran Seminar TA terverifikasi min. 5x (Saat ini: ${semCount}x)`,
                    met: semCount >= 5,
                    actionHref: `${baseUrl}/kehadiran-seminar`,
                    actionLabel: 'Cek Presensi',
                },
                {
                    label:
                        ithScore !== null && ithScore !== undefined
                            ? `Skor Plagiarisme iThenticate ≤ 25% (Skor Anda: ${ithScore}%)`
                            : 'Sertifikat iThenticate ≤ 25% telah diunggah di Dokumen TA',
                    met: ithScore !== null && ithScore !== undefined && Number(ithScore) <= 25,
                    actionHref: `${baseUrl}/dokumen`,
                    actionLabel: 'Unggah iThenticate',
                },
                {
                    label: `Bimbingan Pembimbing 1 valid min. 8x (Saat ini: ${b1}x)`,
                    met: b1 >= 8,
                    actionHref: `${baseUrl}/bimbingan`,
                    actionLabel: 'Buka Logbook',
                },
                ...(hasPembimbing2
                    ? [
                          {
                              label: `Bimbingan Pembimbing 2 valid min. 8x (Saat ini: ${b2}x)`,
                              met: b2 >= 8,
                              actionHref: `${baseUrl}/bimbingan`,
                              actionLabel: 'Buka Logbook',
                          },
                      ]
                    : []),
                {
                    label: 'Produk/Alat TA & Naskah KTI rampung 100%',
                    met: form.data.persentase_produk === 100 && form.data.persentase_kti === 100,
                    actionHref: null,
                },
                {
                    label: 'Bukti lunas pembayaran semester telah dilampirkan',
                    met: form.data.bukti_pembayaran_link.trim().length > 5,
                    actionHref: null,
                },
            ];
        }

        // Sempro & Semhas
        const docCategory = type === 'Sempro' ? 'proposal' : 'laporan_semhas';
        const docStatus = stats?.docs_status?.[docCategory];

        return [
            {
                label: 'Judul & Pembimbing Tugas Akhir telah ditetapkan',
                met: Boolean(stats?.has_project),
                actionHref: `${baseUrl}/tema-matchmaking`,
                actionLabel: 'Cek Topik TA',
            },
            {
                label:
                    type === 'Sempro'
                        ? 'Naskah Proposal TA telah diunggah di arsip Dokumen TA'
                        : 'Draft Laporan Kemajuan (Bab 1–3) telah diunggah di Dokumen TA',
                met: Boolean(docStatus),
                actionHref: `${baseUrl}/dokumen`,
                actionLabel: 'Ke Dokumen TA',
            },
            {
                label: `Bimbingan Pembimbing 1 valid min. 6x (Saat ini: ${b1}x)`,
                met: b1 >= 6,
                actionHref: `${baseUrl}/bimbingan`,
                actionLabel: 'Buka Logbook',
            },
            ...(hasPembimbing2
                ? [
                      {
                          label: `Bimbingan Pembimbing 2 valid min. 6x (Saat ini: ${b2}x)`,
                          met: b2 >= 6,
                          actionHref: `${baseUrl}/bimbingan`,
                          actionLabel: 'Buka Logbook',
                      },
                  ]
                : []),
            {
                label: 'Progres Produk/Eksperimen & Draft KTI minimal 80%',
                met: form.data.persentase_produk >= 80 && form.data.persentase_kti >= 80,
                actionHref: null,
            },
        ];
    };

    const criteria = getCriteria(activeTab);
    const isAllMet = criteria.every((c) => c.met);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        form.post(`${baseUrl}/pendaftaran`, { preserveScroll: true });
    };

    const handleVerify = (id: number, status: 'approved' | 'rejected') => {
        router.patch(
            `${baseUrl}/pendaftaran/${id}/verify`,
            {
                status,
                catatan_penolakan: rejectNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReviewingId(null);
                    setRejectNotes('');
                },
            },
        );
    };

    const renderStatusBadge = (status: string) => {
        if (status === 'approved') {
            return (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Telah Di-ACC & Siap Dijadwalkan
                </span>
            );
        }
        if (status === 'rejected') {
            return (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <XCircle size={14} /> Ditolak — Perlu Perbaikan
                </span>
            );
        }
        return (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Clock size={14} /> Menunggu ACC Pembimbing
            </span>
        );
    };

    const filteredApprovals = pendingList.filter((item: any) =>
        statusFilter === 'all' ? true : item.status === statusFilter,
    );

    return (
        <>
            <Head title="Pendaftaran Seminar & Sidang" />

            <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-8">
                <div className="border-b border-border pb-5">
                    <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                        {isApprover ? 'Verifikasi Kelayakan Ujian' : 'Evaluasi Prasyarat Otomatis'}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        {isApprover
                            ? 'Persetujuan Pendaftaran Seminar & Sidang'
                            : 'Pendaftaran Seminar & Sidang'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isApprover
                            ? 'Tinjau kelengkapan prasyarat akademik mahasiswa bimbingan sebelum masuk ke antrean penjadwalan ujian.'
                            : 'Sistem memvalidasi logbook bimbingan, kehadiran seminar, dan skor iThenticate Anda secara otomatis dari database.'}
                    </p>
                </div>

                {/* ===================================================================== */}
                {/* TAMPILAN DOSEN PEMBIMBING / PANITIA: ANTREAN ACC PENDAFTARAN          */}
                {/* ===================================================================== */}
                {isApprover ? (
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    DAFTAR PENGAJUAN UJIAN
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Pengajuan Mahasiswa ({filteredApprovals.length})
                                </h2>
                            </div>

                            <div className="flex gap-1 rounded-lg bg-secondary p-1 text-xs">
                                {(
                                    [
                                        { key: 'all', label: 'Semua' },
                                        { key: 'pending_pembimbing', label: 'Menunggu ACC' },
                                        { key: 'approved', label: 'Disetujui' },
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

                        <div className="divide-y divide-border">
                            {filteredApprovals.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    Belum ada pengajuan pendaftaran seminar atau sidang pada kategori ini.
                                </div>
                            ) : (
                                filteredApprovals.map((reg: any) => (
                                    <div key={reg.id} className="space-y-3 p-5 hover:bg-muted/30">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                                                        {reg.milestone_type}
                                                    </span>
                                                    <h3 className="text-base font-bold text-foreground">
                                                        {reg.mahasiswa?.name}
                                                    </h3>
                                                </div>

                                                {/* Ringkasan Verifikasi Otomatis */}
                                                {reg.verification_summary && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                                        <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                                                            Bimbingan P1: {reg.verification_summary.bimbingan_1}x
                                                        </span>
                                                        <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                                                            Bimbingan P2: {reg.verification_summary.bimbingan_2}x
                                                        </span>
                                                        <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                                                            Hadir Seminar: {reg.verification_summary.seminar_count}x
                                                        </span>
                                                        {reg.verification_summary.ithenticate_score !== null && (
                                                            <span
                                                                className={`rounded px-2 py-0.5 font-bold ${
                                                                    reg.verification_summary.ithenticate_score <= 25
                                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                                        : 'bg-rose-500/10 text-rose-600'
                                                                }`}
                                                            >
                                                                iThenticate: {reg.verification_summary.ithenticate_score}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-2.5 flex flex-wrap gap-3 text-xs">
                                                    {reg.dokumen_kti_link && (
                                                        <a
                                                            href={reg.dokumen_kti_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                                                        >
                                                            <FileText size={13} /> Berkas KTI <ExternalLink size={11} />
                                                        </a>
                                                    )}
                                                    {reg.dokumen_produk_link && (
                                                        <a
                                                            href={reg.dokumen_produk_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                                                        >
                                                            <LinkIcon size={13} /> Demo Produk <ExternalLink size={11} />
                                                        </a>
                                                    )}
                                                    {reg.bukti_pembayaran_link && (
                                                        <a
                                                            href={reg.bukti_pembayaran_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                                                        >
                                                            <DollarSign size={13} /> Bukti SPP <ExternalLink size={11} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div>{renderStatusBadge(reg.status)}</div>
                                        </div>

                                        {reg.catatan_penolakan && (
                                            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                                                <strong>Catatan Penolakan:</strong> {reg.catatan_penolakan}
                                            </div>
                                        )}

                                        {/* Panel Aksi ACC / Tolak */}
                                        <div>
                                            {reviewingId === reg.id ? (
                                                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                                                    <textarea
                                                        rows={2}
                                                        value={rejectNotes}
                                                        onChange={(e) => setRejectNotes(e.target.value)}
                                                        placeholder="Catatan tambahan atau alasan penolakan (wajib jika menolak)..."
                                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                                                    />
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(reg.id, 'approved')}
                                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            <CheckCircle2 size={13} /> ACC & Siap Dijadwalkan
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(reg.id, 'rejected')}
                                                            className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                                        >
                                                            <RotateCcw size={13} /> Tolak Pengajuan
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReviewingId(null);
                                                                setRejectNotes('');
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
                                                        setReviewingId(reg.id);
                                                        setRejectNotes(reg.catatan_penolakan ?? '');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    <MessageSquareText size={13} />
                                                    {reg.status === 'pending_pembimbing'
                                                        ? 'Proses Persetujuan'
                                                        : 'Ubah Status ACC'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    /* ===================================================================== */
                    /* TAMPILAN MAHASISWA: CHECKLIST SYARAT OTOMATIS & FORM PENDAFTARAN      */
                    /* ===================================================================== */
                    <>
                        <div className="flex gap-1.5 border-b border-border pb-2">
                            {(['Sempro', 'Semhas', 'Sidang'] as const).map((tab) => {
                                const tabStatus = registrations?.[tab]?.status;
                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                            activeTab === tab
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        }`}
                                    >
                                        <span>Pendaftaran {tab}</span>
                                        {tabStatus === 'approved' && <CheckCircle2 size={13} />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Panel Kiri: Checklist Kriteria Otomatis */}
                            <div className="h-fit rounded-xl border border-border bg-card p-6 shadow-xs">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-base font-bold text-foreground">
                                        Prasyarat {activeTab}
                                    </h3>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            isAllMet
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-amber-500/10 text-amber-600'
                                        }`}
                                    >
                                        {criteria.filter((c) => c.met).length}/{criteria.length} Terpenuhi
                                    </span>
                                </div>

                                <ul className="space-y-3.5">
                                    {criteria.map((c: any, i: number) => (
                                        <li
                                            key={i}
                                            className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/50 p-3"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                {c.met ? (
                                                    <CheckCircle2
                                                        className="mt-0.5 shrink-0 text-emerald-500"
                                                        size={17}
                                                    />
                                                ) : (
                                                    <XCircle
                                                        className="mt-0.5 shrink-0 text-rose-500"
                                                        size={17}
                                                    />
                                                )}
                                                <span
                                                    className={`text-xs leading-relaxed ${
                                                        c.met
                                                            ? 'font-medium text-foreground'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {c.label}
                                                </span>
                                            </div>

                                            {!c.met && c.actionHref && (
                                                <Link
                                                    href={c.actionHref}
                                                    className="shrink-0 rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    {c.actionLabel}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Panel Kanan: Form Pendaftaran / Status Pengajuan */}
                            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                                {regData && regData.status !== 'rejected' ? (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-bold text-foreground">
                                            Status Pendaftaran {activeTab}
                                        </h3>
                                        {renderStatusBadge(regData.status)}

                                        <div className="space-y-2.5 rounded-lg border border-border bg-secondary/40 p-4 text-xs">
                                            <p className="flex items-center gap-2">
                                                <FileText size={14} className="text-primary" />
                                                <a
                                                    href={regData.dokumen_kti_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-semibold text-primary hover:underline"
                                                >
                                                    Lihat Berkas KTI yang Dilampirkan
                                                </a>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <LinkIcon size={14} className="text-primary" />
                                                <a
                                                    href={regData.dokumen_produk_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-semibold text-primary hover:underline"
                                                >
                                                    Lihat Demo / Dokumentasi Produk
                                                </a>
                                            </p>
                                            {regData.bukti_pembayaran_link && (
                                                <p className="flex items-center gap-2">
                                                    <DollarSign size={14} className="text-primary" />
                                                    <a
                                                        href={regData.bukti_pembayaran_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-semibold text-primary hover:underline"
                                                    >
                                                        Lihat Bukti Lunas Pembayaran
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <h3 className="text-base font-bold text-foreground">
                                                Formulir Pengajuan {activeTab}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Lengkapi tautan berkas di bawah ini setelah seluruh prasyarat di sebelah kiri terpenuhi.
                                            </p>
                                        </div>

                                        {regData?.status === 'rejected' && regData.catatan_penolakan && (
                                            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                <div>
                                                    <strong>Pengajuan Sebelumnya Ditolak:</strong>{' '}
                                                    {regData.catatan_penolakan}. Silakan perbaiki dan kirim ulang.
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                                    Progres Produk (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={form.data.persentase_produk}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'persentase_produk',
                                                            Number(e.target.value),
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                                    Progres KTI (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={form.data.persentase_kti}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'persentase_kti',
                                                            Number(e.target.value),
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                                <FileText size={13} /> Tautan Draft / Laporan KTI
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={form.data.dokumen_kti_link}
                                                onChange={(e) =>
                                                    form.setData('dokumen_kti_link', e.target.value)
                                                }
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                placeholder="Otomatis terisi dari Dokumen TA atau tempel URL GDrive..."
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                                <LinkIcon size={13} /> Tautan Demo / Dokumentasi Produk
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={form.data.dokumen_produk_link}
                                                onChange={(e) =>
                                                    form.setData('dokumen_produk_link', e.target.value)
                                                }
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                placeholder="https://youtube.com/... atau tautan file arsip"
                                            />
                                        </div>

                                        {activeTab === 'Sidang' && (
                                            <div>
                                                <label className="mb-1 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                                    <DollarSign size={13} /> Bukti Lunas Pembayaran Semester (URL)
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.data.bukti_pembayaran_link}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'bukti_pembayaran_link',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                    placeholder="https://drive.google.com/..."
                                                />
                                                {form.errors.bukti_pembayaran_link && (
                                                    <span className="mt-1 block text-xs text-destructive">
                                                        {form.errors.bukti_pembayaran_link}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {form.errors.milestone_type && (
                                            <p className="text-xs font-semibold text-destructive">
                                                {form.errors.milestone_type}
                                            </p>
                                        )}

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={!isAllMet || form.processing}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                            >
                                                <Send size={15} />
                                                {isAllMet
                                                    ? `Ajukan Pendaftaran ${activeTab}`
                                                    : 'Penuhi Semua Prasyarat Untuk Mendaftar'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

PendaftaranSidang.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;