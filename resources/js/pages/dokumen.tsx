import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Download,
    ExternalLink,
    FileCheck2,
    FileText,
    MessageSquareText,
    Percent,
    RotateCcw,
    ShieldCheck,
    Trash2,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Dokumen Tugas Akhir', href: '/dokumen' },
];

interface ChecklistItem {
    category: string;
    label: string;
    milestone: string;
    accept: string;
    description: string;
    document: any | null;
}

interface SummaryMetrics {
    approved: number;
    rejected: number;
    uploaded: number;
    total: number;
    percentage: number;
    ithenticate_score: number | null;
    ithenticate_passed: boolean | null;
}

interface Props {
    isReviewer: boolean;
    checklist: ChecklistItem[];
    documents: any[];
    students: { id: number; name: string }[];
    summary: SummaryMetrics | null;
}

export default function Dokumen({
    isReviewer,
    checklist,
    documents,
    students,
    summary,
}: Props) {
    const { currentTeam } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;

    // State Form Upload Mahasiswa
    const [activeUploadItem, setActiveUploadItem] = useState<ChecklistItem | null>(null);

    // State Filter & Review Dosen / Panitia
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [studentFilter, setStudentFilter] = useState<string>('all');
    const [reviewingId, setReviewingId] = useState<number | null>(null);
    const [reviewerNotes, setReviewerNotes] = useState('');

    const { data, setData, post, processing, reset, clearErrors, errors } = useForm<{
        category: string;
        title: string;
        file: File | null;
        similarity_score: string;
    }>({
        category: '',
        title: '',
        file: null,
        similarity_score: '',
    });

    const openUploadPanel = (item: ChecklistItem) => {
        clearErrors();
        setActiveUploadItem(item);
        setData({
            category: item.category,
            title: item.document?.title ?? item.label,
            file: null,
            similarity_score:
                item.document?.similarity_score !== null && item.document?.similarity_score !== undefined
                    ? String(item.document.similarity_score)
                    : '',
        });
    };

    const closeUploadPanel = () => {
        clearErrors();
        setActiveUploadItem(null);
        reset();
    };

    const submitUpload: FormEventHandler = (e) => {
        e.preventDefault();
        post(`${baseUrl}/dokumen`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => closeUploadPanel(),
        });
    };

    const handleDeleteDocument = (doc: any) => {
        if (!window.confirm(`Hapus file "${doc.file_name}"?`)) return;

        router.delete(`${baseUrl}/dokumen/${doc.id}`, {
            preserveScroll: true,
        });
    };

    const handleVerify = (id: number, status: 'approved' | 'rejected') => {
        router.patch(
            `${baseUrl}/dokumen/${id}/verify`,
            {
                status,
                reviewer_notes: reviewerNotes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReviewingId(null);
                    setReviewerNotes('');
                },
            },
        );
    };

    const renderStatusBadge = (status: string | null) => {
        if (!status) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Belum Diunggah
                </span>
            );
        }
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
                        <Clock3 size={12} /> Menunggu Review
                    </span>
                );
        }
    };

    const filteredReviewerDocs = documents.filter((doc) => {
        const matchStatus = statusFilter === 'all' ? true : doc.status === statusFilter;
        const matchStudent = studentFilter === 'all' ? true : String(doc.user_id) === studentFilter;
        return matchStatus && matchStudent;
    });

    return (
        <>
            <Head title="Dokumen Tugas Akhir" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                            {isReviewer ? 'Validasi Berkas Akademik' : 'Arsip Digital & Plagiarisme'}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            {isReviewer ? 'Review Dokumen Tugas Akhir' : 'Dokumen Tugas Akhir'}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            {isReviewer
                                ? 'Periksa kelengkapan naskah Tugas Akhir mahasiswa dan validasi sertifikat iThenticate (maks. 25%).'
                                : 'Unggah naskah proposal, laporan akhir, serta hasil cek plagiarisme iThenticate (maks. 25%) sebagai syarat sidang.'}
                        </p>
                    </div>
                </div>

                {/* ===================================================================== */}
                {/* TAMPILAN MAHASISWA: METRICS + CHECKLIST DOKUMEN                       */}
                {/* ===================================================================== */}
                {!isReviewer && summary && (
                    <>
                        {/* 3 Kartu Metrik */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-xl bg-primary p-5 text-primary-foreground shadow-xs">
                                <div className="mb-2 flex items-start justify-between">
                                    <p className="text-xs font-medium text-primary-foreground/85">
                                        Kelengkapan Disetujui
                                    </p>
                                    <FileCheck2 size={18} className="text-primary-foreground/80" />
                                </div>
                                <h2 className="mb-2 text-3xl font-bold">
                                    {summary.approved}{' '}
                                    <span className="text-sm font-normal text-primary-foreground/75">
                                        / {summary.total} berkas
                                    </span>
                                </h2>
                                <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                                    <div
                                        className="h-full rounded-full bg-white transition-all duration-500"
                                        style={{ width: `${summary.percentage}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-primary-foreground/90">
                                    {summary.percentage}% dokumen persyaratan tervalidasi
                                </p>
                            </div>

                            {/* Skor iThenticate */}
                            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                <div className="mb-2 flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Skor iThenticate</p>
                                    <Percent size={18} className="text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground">
                                    {summary.ithenticate_score !== null
                                        ? `${summary.ithenticate_score}%`
                                        : 'Belum Cek'}
                                </h2>
                                <p
                                    className={`mt-1 text-xs font-medium ${
                                        summary.ithenticate_passed === null
                                            ? 'text-muted-foreground'
                                            : summary.ithenticate_passed
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                >
                                    {summary.ithenticate_passed === null
                                        ? 'Batas maksimum similarity: 25%'
                                        : summary.ithenticate_passed
                                          ? 'Lolos ambang batas (≤ 25%)'
                                          : 'Melebihi batas 25% — Wajib revisi'}
                                </p>
                            </div>

                            {/* Status Revisi */}
                            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                <div className="mb-2 flex items-start justify-between text-muted-foreground">
                                    <p className="text-sm font-medium">Status Pemeriksaan</p>
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground">
                                    {summary.rejected > 0
                                        ? `${summary.rejected} Revisi`
                                        : `${summary.uploaded} Diunggah`}
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {summary.rejected > 0
                                        ? 'Periksa catatan pembimbing dan unggah ulang'
                                        : 'Semua berkas terunggah dalam kondisi baik'}
                                </p>
                            </div>
                        </div>

                        {/* Panel Modal / Inline Upload Dokumen */}
                        {activeUploadItem && (
                            <form
                                onSubmit={submitUpload}
                                className="space-y-4 rounded-xl border-2 border-primary bg-card p-6 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                                    <div>
                                        <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                                            Tahap {activeUploadItem.milestone}
                                        </span>
                                        <h2 className="mt-1 text-lg font-bold text-foreground">
                                            {activeUploadItem.document
                                                ? `Unggah Revisi: ${activeUploadItem.label}`
                                                : `Unggah Berkas: ${activeUploadItem.label}`}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {activeUploadItem.description}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeUploadPanel}
                                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                            Judul Dokumen
                                        </label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                            required
                                        />
                                        {errors.title && (
                                            <span className="mt-1 block text-xs text-destructive">
                                                {errors.title}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                            Pilih File ({activeUploadItem.accept} · Maks. 20 MB)
                                        </label>
                                        <input
                                            type="file"
                                            accept={activeUploadItem.accept}
                                            onChange={(e) =>
                                                setData('file', e.target.files?.[0] ?? null)
                                            }
                                            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground"
                                            required
                                        />
                                        {errors.file && (
                                            <span className="mt-1 block text-xs text-destructive">
                                                {errors.file}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Input Skor Khusus iThenticate */}
                                {activeUploadItem.category === 'ithenticate' && (
                                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                                        <label className="mb-1 block text-xs font-bold text-foreground">
                                            Persentase Similarity Index iThenticate (%)
                                        </label>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={data.similarity_score}
                                                onChange={(e) =>
                                                    setData('similarity_score', e.target.value)
                                                }
                                                placeholder="Contoh: 18.5"
                                                className="w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold text-foreground"
                                                required
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                Syarat kelulusan Sidang TA: <strong>≤ 25%</strong>
                                            </span>
                                        </div>
                                        {data.similarity_score !== '' &&
                                            parseFloat(data.similarity_score) > 25 && (
                                                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                                                    <AlertTriangle size={14} /> Peringatan: Skor di atas 25%
                                                    tidak memenuhi syarat kelayakan sidang.
                                                </p>
                                            )}
                                        {errors.similarity_score && (
                                            <span className="mt-1 block text-xs text-destructive">
                                                {errors.similarity_score}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeUploadPanel}
                                        className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground hover:bg-muted"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                    >
                                        <Upload size={14} />
                                        {processing ? 'Mengunggah...' : 'Simpan & Unggah Berkas'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Checklist Dokumen Persyaratan */}
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                            <div className="border-b border-border p-5">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    CHECKLIST KELENGKAPAN TA
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Daftar Dokumen Persyaratan
                                </h2>
                            </div>

                            <div className="divide-y divide-border">
                                {checklist.map((item) => {
                                    const doc = item.document;

                                    return (
                                        <div
                                            key={item.category}
                                            className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-muted/30 md:flex-row md:items-center"
                                        >
                                            <div className="flex min-w-0 flex-1 items-start gap-3.5">
                                                <div
                                                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                                        doc?.status === 'approved'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-accent text-accent-foreground'
                                                    }`}
                                                >
                                                    <FileText size={20} />
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-sm font-bold text-foreground">
                                                            {item.label}
                                                        </h3>
                                                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                                                            Tahap {item.milestone}
                                                        </span>
                                                        {doc?.version && (
                                                            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                                                                v{doc.version}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-muted-foreground">
                                                        {doc
                                                            ? `${doc.file_name} · ${doc.file_size}`
                                                            : item.description}
                                                    </p>

                                                    {doc?.similarity_score !== null &&
                                                        doc?.similarity_score !== undefined && (
                                                            <p
                                                                className={`text-xs font-bold ${
                                                                    doc.similarity_score <= 25
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : 'text-rose-600 dark:text-rose-400'
                                                                }`}
                                                            >
                                                                Similarity Index: {doc.similarity_score}%{' '}
                                                                {doc.similarity_score <= 25
                                                                    ? '(Memenuhi syarat ≤ 25%)'
                                                                    : '(Melebihi batas 25%)'}
                                                            </p>
                                                        )}

                                                    {doc?.reviewer_notes && (
                                                        <div className="mt-2 rounded-lg border border-border bg-secondary/70 p-2.5 text-xs">
                                                            <span className="font-bold text-foreground">
                                                                Catatan Pemeriksa:{' '}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {doc.reviewer_notes}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Aksi Baris */}
                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                {renderStatusBadge(doc?.status ?? null)}

                                                {doc?.file_url && (
                                                    <a
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                                                    >
                                                        <ExternalLink size={13} /> Lihat File
                                                    </a>
                                                )}

                                                {doc?.status !== 'approved' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openUploadPanel(item)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                                                    >
                                                        <Upload size={13} />
                                                        {doc ? 'Unggah Revisi' : 'Unggah'}
                                                    </button>
                                                )}

                                                {doc && doc.status !== 'approved' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDocument(doc)}
                                                        title="Hapus file"
                                                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ===================================================================== */}
                {/* TAMPILAN DOSEN PEMBIMBING / PANITIA: VALIDASI DOKUMEN MAHASISWA       */}
                {/* ===================================================================== */}
                {isReviewer && (
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    ANTREAN VALIDASI BERKAS
                                </p>
                                <h2 className="text-lg font-bold text-foreground">
                                    Dokumen Unggahan Mahasiswa ({filteredReviewerDocs.length})
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {students.length > 0 && (
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
                            {filteredReviewerDocs.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    Belum ada dokumen mahasiswa pada kategori ini.
                                </div>
                            ) : (
                                filteredReviewerDocs.map((doc) => (
                                    <div key={doc.id} className="space-y-3 p-5 hover:bg-muted/30">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-primary">
                                                        {doc.user?.name ?? 'Mahasiswa'}
                                                    </span>
                                                    <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] font-bold text-secondary-foreground">
                                                        v{doc.version}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-foreground">
                                                    {doc.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {doc.file_name} · {doc.file_size}
                                                </p>
                                                {doc.similarity_score !== null &&
                                                    doc.similarity_score !== undefined && (
                                                        <p
                                                            className={`text-xs font-bold ${
                                                                doc.similarity_score <= 25
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-600'
                                                            }`}
                                                        >
                                                            Skor iThenticate: {doc.similarity_score}%{' '}
                                                            {doc.similarity_score <= 25
                                                                ? '(Lolos ≤ 25%)'
                                                                : '(Melebihi 25%)'}
                                                        </p>
                                                    )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {renderStatusBadge(doc.status)}
                                                {doc.file_url && (
                                                    <a
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                                                    >
                                                        <Download size={13} /> Unduh / Periksa
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {doc.reviewer_notes && (
                                            <div className="rounded-lg border border-border bg-secondary/60 p-2.5 text-xs">
                                                <span className="font-bold text-foreground">Catatan: </span>
                                                <span className="text-muted-foreground">
                                                    {doc.reviewer_notes}
                                                </span>
                                            </div>
                                        )}

                                        {/* Panel Aksi Validasi */}
                                        <div>
                                            {reviewingId === doc.id ? (
                                                <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                                                    <textarea
                                                        rows={2}
                                                        value={reviewerNotes}
                                                        onChange={(e) => setReviewerNotes(e.target.value)}
                                                        placeholder="Tuliskan catatan review atau poin revisi..."
                                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                                                    />
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(doc.id, 'approved')}
                                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            <CheckCircle2 size={13} /> Setujui Dokumen
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(doc.id, 'rejected')}
                                                            className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                                                        >
                                                            <RotateCcw size={13} /> Minta Revisi
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReviewingId(null);
                                                                setReviewerNotes('');
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
                                                        setReviewingId(doc.id);
                                                        setReviewerNotes(doc.reviewer_notes ?? '');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    <MessageSquareText size={13} />
                                                    {doc.status === 'pending'
                                                        ? 'Periksa & Validasi'
                                                        : 'Ubah Status Validasi'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Dokumen.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;