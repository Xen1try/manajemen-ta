import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpen,
    CheckCheck,
    CheckCircle2,
    GitPullRequest,
    Lock,
    Play,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    Unlock,
    UserMinus,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Tema & Matchmaking', href: '/tema-matchmaking' },
];

export default function TemaMatchmaking({
    projects = [],
    temaSelection,
    unmatchedSelections = [],
    dosens = [],
    mahasiswas = [],
    competencies = [],
    dosenProfile,
    studentSkills = [],
    roleFlags,
}: any) {
    const { currentTeam, timeline } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;

    const [activeTab, setActiveTab] = useState<'katalog' | 'pengajuan' | 'hasil' | 'approval'>('katalog');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [onlyAvailableQuota, setOnlyAvailableQuota] = useState(false);

    const isTemaBuka = timeline?.activePhases?.includes('pembagian_tema') || timeline?.isAdminOverride;

    // Proyek yang ditampilkan di Katalog Tipe 2 (baik Matchmaking maupun Draft Plotting yang kuotanya masih sisa)
    const temaProjects = useMemo(() => {
        return projects.filter((p: any) => {
            const isCatalogType =
                p.tipe === 'Tipe 2' && ['Matchmaking', 'Draft Plotting'].includes(p.status);
            if (!isCatalogType) return false;

            const remaining = p.kuota - (p.mahasiswas?.length || 0);
            if (onlyAvailableQuota && remaining <= 0) return false;

            if (catalogSearch.trim()) {
                const q = catalogSearch.toLowerCase();
                const matchTitle = p.judul?.toLowerCase().includes(q);
                const matchDosen = p.pengusul?.name?.toLowerCase().includes(q);
                return matchTitle || matchDosen;
            }
            return true;
        });
    }, [projects, catalogSearch, onlyAvailableQuota]);

    const assignedProjects = projects.filter((p: any) =>
        ['Draft Plotting', 'Assigned'].includes(p.status),
    );
    const pendingProjects = projects.filter((p: any) => p.status === 'Pending Kaprodi');
    const draftPlottingCount = assignedProjects.filter(
        (p: any) => p.status === 'Draft Plotting',
    ).length;

    // Hitung kecocokan skill mahasiswa terhadap topik tertentu
    const computeCompatibility = (reqSkills: any[]) => {
        const filteredReqs = (reqSkills || []).filter((r: any) => Number(r.level) > 1);
        if (filteredReqs.length === 0) return { eligible: true, percentage: 100 };

        const skillMap = new Map(
            (studentSkills || []).map((s: any) => [s.name?.toLowerCase().trim(), Number(s.level)]),
        );

        let eligible = true;
        let totalReq = 0;
        let achieved = 0;

        filteredReqs.forEach((req: any) => {
            const target = Number(req.level) || 1;
            const actual = skillMap.get(req.name?.toLowerCase().trim()) ?? 1;
            if (actual < target) eligible = false;
            totalReq += target;
            achieved += Math.min(actual, target);
        });

        return {
            eligible,
            percentage: totalReq > 0 ? Math.round((achieved / totalReq) * 100) : 100,
        };
    };

    const buildInitialSkills = () => {
        return competencies.map((c: any) => ({ name: c.name, level: 1 }));
    };

    const formPengajuan = useForm({
        tipe: roleFlags?.isDosen ? 'Tipe 2' : 'Mandiri',
        judul: '',
        deskripsi: '',
        kuota: 1,
        required_skills: buildInitialSkills() as { name: string; level: number }[],
        mahasiswa_ids: [''],
        pembimbing_ids: [''],
    });

    const formTema = useForm({
        pilihan_1_id: temaSelection?.pilihan_1_id ? String(temaSelection.pilihan_1_id) : '',
        pilihan_2_id: temaSelection?.pilihan_2_id ? String(temaSelection.pilihan_2_id) : '',
        pilihan_3_id: temaSelection?.pilihan_3_id ? String(temaSelection.pilihan_3_id) : '',
    });

    const handleTarikProfilDosen = () => {
        if (dosenProfile && Array.isArray(dosenProfile.skill_vector)) {
            const profSkillsMap = new Map(
                dosenProfile.skill_vector.map((s: any) => [s.name, s.level]),
            );
            const matchedSkills = competencies.map((c: any) => ({
                name: c.name,
                level: profSkillsMap.has(c.name) ? Number(profSkillsMap.get(c.name)) : 1,
            }));
            formPengajuan.setData('required_skills', matchedSkills);
        } else {
            alert('Profil akademik Anda belum memiliki data keahlian.');
        }
    };

    const submitPengajuan = (e: React.FormEvent) => {
        e.preventDefault();
        formPengajuan.transform((data) => ({
            ...data,
            mahasiswa_ids: data.mahasiswa_ids.filter((id) => id !== ''),
            pembimbing_ids: data.pembimbing_ids.filter((id) => id !== ''),
        }));
        formPengajuan.post(`${baseUrl}/ta-projects`, {
            onSuccess: () => {
                formPengajuan.reset();
                setActiveTab(formPengajuan.data.tipe === 'Tipe 2' ? 'katalog' : 'hasil');
            },
        });
    };

    const submitTema = (e: React.FormEvent) => {
        e.preventDefault();
        formTema.post(`${baseUrl}/tema-matchmaking/lock`, { preserveScroll: true });
    };

    const runAlgorithm = () => {
        if (
            confirm(
                'Jalankan algoritma Vector Matchmaking? Hasil Draft Plotting yang belum diresmikan akan dihitung ulang.',
            )
        ) {
            router.post(`${baseUrl}/tema-matchmaking/run-algorithm`, {}, {
                onSuccess: () => setActiveTab('hasil'),
            });
        }
    };

    const handleFinalizePlotting = () => {
        if (
            confirm(
                `Resmikan seluruh ${draftPlottingCount} tim Draft Plotting menjadi Assigned permanen?`,
            )
        ) {
            router.post(`${baseUrl}/tema-matchmaking/finalize`, {}, { preserveScroll: true });
        }
    };

    const handleOverride = (projectId: number, mahasiswaId: string) => {
        if (!mahasiswaId) return;
        router.post(
            `${baseUrl}/tema-matchmaking/${projectId}/override`,
            { mahasiswa_id: mahasiswaId },
            { preserveScroll: true },
        );
    };

    const handleDetachMember = (projectId: number, mahasiswaId: number, name: string) => {
        if (!confirm(`Keluarkan ${name} dari draft tim ini?`)) return;
        router.delete(`${baseUrl}/tema-matchmaking/${projectId}/members/${mahasiswaId}`, {
            preserveScroll: true,
        });
    };

    const approveMandiri = (projectId: number) => {
        if (confirm('Setujui pengajuan judul mandiri ini?')) {
            router.post(`${baseUrl}/ta-projects/${projectId}/approve`, {}, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Tema & Matchmaking TA" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Banner Status Fase Timeline */}
                <div
                    className={`flex items-start gap-4 rounded-xl border p-4 ${
                        isTemaBuka
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                    }`}
                >
                    <div
                        className={`shrink-0 rounded-full p-2 ${
                            isTemaBuka
                                ? 'bg-emerald-500/20 text-emerald-600'
                                : 'bg-rose-500/20 text-rose-600'
                        }`}
                    >
                        {isTemaBuka ? <Unlock size={20} /> : <Lock size={20} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">
                            {isTemaBuka ? 'Fase Pembagian Tema DIBUKA' : 'Fase Pembagian Tema DITUTUP'}
                        </h3>
                        <p className="mt-1 text-xs opacity-85">
                            {isTemaBuka
                                ? 'Mahasiswa dapat memilih prioritas topik dari katalog atau mengajukan judul mandiri. Dosen dapat mengusulkan topik Tipe 1 & Tipe 2.'
                                : 'Timeline akademik saat ini tidak berada pada fase pembagian tema. Pengajuan baru dikunci otomatis.'}
                        </p>
                    </div>
                </div>

                {/* Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                            Bursa Judul & Vector Matchmaking
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            Tema & Pengajuan Judul TA
                        </h1>
                    </div>

                    {roleFlags?.isPanitia && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={runAlgorithm}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:opacity-90"
                            >
                                <Play size={15} /> Jalankan Matchmaking
                            </button>
                            {draftPlottingCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleFinalizePlotting}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                                >
                                    <CheckCheck size={15} /> Resmikan Plotting ({draftPlottingCount})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* TABS */}
                <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('katalog')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'katalog'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                    >
                        <BookOpen size={15} /> Katalog Tema ({temaProjects.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pengajuan')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'pengajuan'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                    >
                        <GitPullRequest size={15} /> Buat Pengajuan
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('hasil')}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'hasil'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                    >
                        <CheckCircle2 size={15} /> Hasil Plotting ({assignedProjects.length})
                    </button>
                    {roleFlags?.isPanitia && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('approval')}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                                activeTab === 'approval'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                        >
                            <ShieldCheck size={15} /> Approval Kaprodi
                            {pendingProjects.length > 0 && (
                                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold">
                                    {pendingProjects.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* ===================================================================== */}
                {/* TAB 1: KATALOG MATCHMAKING & KERANJANG PILIHAN MAHASISWA              */}
                {/* ===================================================================== */}
                {activeTab === 'katalog' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-2">
                            {/* Search & Filter Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
                                <div className="relative min-w-[220px] flex-1">
                                    <Search
                                        size={14}
                                        className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <input
                                        type="text"
                                        value={catalogSearch}
                                        onChange={(e) => setCatalogSearch(e.target.value)}
                                        placeholder="Cari judul topik atau nama dosen pengusul..."
                                        className="w-full rounded-lg border border-input bg-background py-1.5 pr-3 pl-8 text-xs text-foreground"
                                    />
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={onlyAvailableQuota}
                                        onChange={(e) => setOnlyAvailableQuota(e.target.checked)}
                                        className="rounded border-input text-primary"
                                    />
                                    Hanya kuota tersedia
                                </label>
                            </div>

                            {temaProjects.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                                    Belum ada judul Tipe 2 yang tersedia di katalog.
                                </div>
                            ) : (
                                temaProjects.map((p: any) => {
                                    const remainingQuota = p.kuota - (p.mahasiswas?.length || 0);
                                    const compat = roleFlags?.isMahasiswa
                                        ? computeCompatibility(p.required_skills)
                                        : null;

                                    return (
                                        <div
                                            key={p.id}
                                            className="rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40"
                                        >
                                            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] font-bold text-secondary-foreground">
                                                        ID #{p.id}
                                                    </span>
                                                    <span
                                                        className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                                                            remainingQuota > 0
                                                                ? 'border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                                : 'border-rose-300 bg-rose-500/10 text-rose-600'
                                                        }`}
                                                    >
                                                        Sisa Kuota: {Math.max(0, remainingQuota)}/{p.kuota}
                                                    </span>
                                                </div>

                                                {compat && (
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                                            compat.eligible
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        }`}
                                                    >
                                                        <Sparkles size={11} />
                                                        Kecocokan: {compat.percentage}%{' '}
                                                        {compat.eligible ? '(Memenuhi)' : '(Kurang)'}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="mb-2 text-lg font-bold text-foreground">
                                                {p.judul}
                                            </h3>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                {p.deskripsi}
                                            </p>

                                            {p.required_skills &&
                                                p.required_skills.filter((r: any) => r.level > 1)
                                                    .length > 0 && (
                                                    <div className="mb-4 rounded-lg border border-border bg-secondary/40 p-3">
                                                        <h4 className="mb-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                            Syarat Kompetensi (Min. Level)
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {p.required_skills
                                                                .filter((req: any) => req.level > 1)
                                                                .map((req: any, i: number) => (
                                                                    <span
                                                                        key={i}
                                                                        className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
                                                                    >
                                                                        {req.name}
                                                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                                                            Lvl {req.level}
                                                                        </span>
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Users size={14} className="text-primary" />{' '}
                                                    Pengusul: <strong className="text-foreground">{p.pengusul?.name}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Keranjang Pilihan Mahasiswa */}
                        {roleFlags?.isMahasiswa && (
                            <div className="sticky top-6 h-max rounded-xl border border-border bg-card p-5 shadow-xs">
                                <h3 className="mb-1 text-base font-bold text-foreground">
                                    Keranjang Pilihan Anda
                                </h3>
                                <p className="mb-4 text-xs text-muted-foreground">
                                    Urutkan 3 prioritas topik yang paling sesuai dengan keahlian Anda.
                                </p>

                                {temaSelection?.status === 'Locked' ||
                                temaSelection?.status === 'Matched' ? (
                                    <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                                        <div className="text-center">
                                            <CheckCircle2 size={28} className="mx-auto mb-1.5" />
                                            <p className="text-sm font-bold">
                                                Pilihan Sudah Dikunci ({temaSelection.status})
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 border-t border-emerald-500/20 pt-3 text-xs">
                                            <p>
                                                <strong>1.</strong>{' '}
                                                {temaSelection.pilihan1?.judul ?? `#${temaSelection.pilihan_1_id}`}
                                            </p>
                                            <p>
                                                <strong>2.</strong>{' '}
                                                {temaSelection.pilihan2?.judul ?? `#${temaSelection.pilihan_2_id}`}
                                            </p>
                                            <p>
                                                <strong>3.</strong>{' '}
                                                {temaSelection.pilihan3?.judul ?? `#${temaSelection.pilihan_3_id}`}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={submitTema} className="space-y-4">
                                        {[1, 2, 3].map((num) => {
                                            const fieldKey = `pilihan_${num}_id` as
                                                | 'pilihan_1_id'
                                                | 'pilihan_2_id'
                                                | 'pilihan_3_id';
                                            const otherSelected = [
                                                formTema.data.pilihan_1_id,
                                                formTema.data.pilihan_2_id,
                                                formTema.data.pilihan_3_id,
                                            ].filter((_, idx) => idx + 1 !== num);

                                            return (
                                                <div key={num}>
                                                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                                        Pilihan Prioritas {num}
                                                    </label>
                                                    <select
                                                        disabled={!isTemaBuka}
                                                        value={formTema.data[fieldKey]}
                                                        onChange={(e) =>
                                                            formTema.setData(fieldKey, e.target.value)
                                                        }
                                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs text-foreground"
                                                        required
                                                    >
                                                        <option value="">-- Pilih Judul --</option>
                                                        {temaProjects.map((p: any) => {
                                                            const isTaken = otherSelected.includes(
                                                                String(p.id),
                                                            );
                                                            return (
                                                                <option
                                                                    key={p.id}
                                                                    value={p.id}
                                                                    disabled={isTaken}
                                                                >
                                                                    [#{p.id}] {p.judul.substring(0, 42)}
                                                                    {isTaken ? ' (Sudah dipilih)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            );
                                        })}

                                        {Object.values(formTema.errors)[0] && (
                                            <p className="text-xs font-semibold text-destructive">
                                                {Object.values(formTema.errors)[0]}
                                            </p>
                                        )}

                                        <div className="pt-2">
                                            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                                                Pastikan level keahlian pada Profil Akademik Anda memenuhi syarat minimum topik pilihan.
                                            </p>
                                            <button
                                                type="submit"
                                                disabled={!isTemaBuka || formTema.processing}
                                                className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                            >
                                                Kunci Pilihan Saya
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ===================================================================== */}
                {/* TAB 2: BUAT PENGAJUAN BARU                                            */}
                {/* ===================================================================== */}
                {activeTab === 'pengajuan' && (
                    <div className="relative max-w-2xl overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs">
                        {!isTemaBuka && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/75 p-6 text-center backdrop-blur-xs">
                                <Lock size={32} className="mb-2 text-muted-foreground" />
                                <p className="text-sm font-bold text-foreground">
                                    Form Terkunci oleh Gatekeeper Timeline
                                </p>
                            </div>
                        )}
                        <form onSubmit={submitPengajuan} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                    Tipe Pengajuan
                                </label>
                                <select
                                    value={formPengajuan.data.tipe}
                                    onChange={(e) => formPengajuan.setData('tipe', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                    {roleFlags?.isDosen && (
                                        <option value="Tipe 1">Tipe 1 (Penunjukan Langsung)</option>
                                    )}
                                    {roleFlags?.isDosen && (
                                        <option value="Tipe 2">
                                            Tipe 2 (Dilempar ke Katalog Matchmaking)
                                        </option>
                                    )}
                                    {roleFlags?.isMahasiswa && (
                                        <option value="Mandiri">
                                            Mandiri (Judul Bawaan Mahasiswa)
                                        </option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                    Judul Tugas Akhir
                                </label>
                                <input
                                    type="text"
                                    value={formPengajuan.data.judul}
                                    onChange={(e) => formPengajuan.setData('judul', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                    Deskripsi Singkat & Ruang Lingkup
                                </label>
                                <textarea
                                    value={formPengajuan.data.deskripsi}
                                    onChange={(e) =>
                                        formPengajuan.setData('deskripsi', e.target.value)
                                    }
                                    className="h-24 w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground"
                                    required
                                />
                            </div>

                            {formPengajuan.data.tipe === 'Tipe 2' && (
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                        Kuota Mahasiswa (Maks. Anggota Tim)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formPengajuan.data.kuota}
                                        onChange={(e) =>
                                            formPengajuan.setData(
                                                'kuota',
                                                parseInt(e.target.value, 10) || 1,
                                            )
                                        }
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                        required
                                    />
                                </div>
                            )}

                            {formPengajuan.data.tipe === 'Tipe 1' && (
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                        Pilih Mahasiswa (Bisa lebih dari 1 untuk Tim)
                                    </label>
                                    {formPengajuan.data.mahasiswa_ids.map((id, index) => (
                                        <div key={index} className="mb-2 flex gap-2">
                                            <select
                                                value={id}
                                                onChange={(e) => {
                                                    const newIds = [
                                                        ...formPengajuan.data.mahasiswa_ids,
                                                    ];
                                                    newIds[index] = e.target.value;
                                                    formPengajuan.setData('mahasiswa_ids', newIds);
                                                }}
                                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                required
                                            >
                                                <option value="">
                                                    -- Pilih Anggota Tim {index + 1} --
                                                </option>
                                                {mahasiswas.map((m: any) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newIds =
                                                            formPengajuan.data.mahasiswa_ids.filter(
                                                                (_, i) => i !== index,
                                                            );
                                                        formPengajuan.setData(
                                                            'mahasiswa_ids',
                                                            newIds,
                                                        );
                                                    }}
                                                    className="rounded-lg bg-rose-500/10 px-3 text-xs font-bold text-rose-600"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            formPengajuan.setData('mahasiswa_ids', [
                                                ...formPengajuan.data.mahasiswa_ids,
                                                '',
                                            ])
                                        }
                                        className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"
                                    >
                                        + Tambah Anggota Mahasiswa
                                    </button>
                                </div>
                            )}

                            {/* Kebutuhan Skill Tipe 2 */}
                            {formPengajuan.data.tipe === 'Tipe 2' && (
                                <div className="rounded-xl border border-border bg-secondary/40 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <label className="block text-xs font-bold text-foreground">
                                            Kebutuhan Kompetensi & Target Level
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleTarikProfilDosen}
                                            className="flex items-center gap-1 rounded bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-500/25 dark:text-emerald-400"
                                        >
                                            <RefreshCw size={12} /> Samakan dengan Profil Saya
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {formPengajuan.data.required_skills.map((skill, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5"
                                            >
                                                <span
                                                    className="ml-1 truncate text-xs font-semibold text-foreground"
                                                    title={skill.name}
                                                >
                                                    {skill.name}
                                                </span>
                                                <select
                                                    value={skill.level}
                                                    onChange={(e) => {
                                                        const newSkills = [
                                                            ...formPengajuan.data.required_skills,
                                                        ];
                                                        newSkills[index].level = parseInt(
                                                            e.target.value,
                                                            10,
                                                        );
                                                        formPengajuan.setData(
                                                            'required_skills',
                                                            newSkills,
                                                        );
                                                    }}
                                                    className="w-36 rounded border border-input bg-secondary/50 px-2 py-1 text-xs text-foreground"
                                                >
                                                    <option value={1}>Lvl 1 (Dasar)</option>
                                                    <option value={2}>Lvl 2 (Pemula)</option>
                                                    <option value={3}>Lvl 3 (Menengah)</option>
                                                    <option value={4}>Lvl 4 (Mahir)</option>
                                                    <option value={5}>Lvl 5 (Ahli)</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                                    Dosen Pembimbing
                                </label>
                                {formPengajuan.data.pembimbing_ids.map((id, index) => (
                                    <div key={index} className="mb-2 flex gap-2">
                                        <select
                                            value={id}
                                            onChange={(e) => {
                                                const newIds = [
                                                    ...formPengajuan.data.pembimbing_ids,
                                                ];
                                                newIds[index] = e.target.value;
                                                formPengajuan.setData('pembimbing_ids', newIds);
                                            }}
                                            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                            required
                                        >
                                            <option value="">
                                                -- Pilih Pembimbing{' '}
                                                {index === 0 ? 'Utama' : 'Pendamping'} --
                                            </option>
                                            {dosens.map((d: any) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newIds =
                                                        formPengajuan.data.pembimbing_ids.filter(
                                                            (_, i) => i !== index,
                                                        );
                                                    formPengajuan.setData('pembimbing_ids', newIds);
                                                }}
                                                className="rounded-lg bg-rose-500/10 px-3 text-xs font-bold text-rose-600"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() =>
                                        formPengajuan.setData('pembimbing_ids', [
                                            ...formPengajuan.data.pembimbing_ids,
                                            '',
                                        ])
                                    }
                                    className="mt-1 flex items-center gap-1 text-xs font-bold text-primary"
                                >
                                    + Tambah Pembimbing Lain
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={formPengajuan.processing}
                                className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                            >
                                Kirim Pengajuan
                            </button>
                        </form>
                    </div>
                )}

                {/* ===================================================================== */}
                {/* TAB 3: HASIL PLOTTING & UNMATCHED MONITOR (PANITIA)                   */}
                {/* ===================================================================== */}
                {activeTab === 'hasil' && (
                    <div className="space-y-6">
                        {/* Peringatan Mahasiswa Belum Ter-plotting (Khusus Panitia) */}
                        {roleFlags?.isPanitia && unmatchedSelections.length > 0 && (
                            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
                                <div className="mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                    <AlertCircle size={18} />
                                    <h3 className="text-sm font-bold">
                                        {unmatchedSelections.length} Mahasiswa Sudah Mengunci Pilihan Namun Belum Ter-plotting
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                                    {unmatchedSelections.map((sel: any) => (
                                        <div
                                            key={sel.id}
                                            className="rounded-lg border border-amber-500/20 bg-card p-3 text-xs"
                                        >
                                            <p className="font-bold text-foreground">
                                                {sel.mahasiswa?.name}
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                Pilihan: [#{sel.pilihan_1_id}] · [#{sel.pilihan_2_id}] · [#
                                                {sel.pilihan_3_id}]
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {assignedProjects.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                                Belum ada hasil plotting tim Tugas Akhir.
                            </div>
                        ) : (
                            assignedProjects.map((p: any) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs md:flex-row"
                                >
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    p.status === 'Draft Plotting'
                                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                }`}
                                            >
                                                Status: {p.status}
                                            </span>
                                            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                                                {p.tipe}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-foreground">{p.judul}</h3>

                                        <div className="text-sm text-muted-foreground">
                                            Anggota Tim ({p.mahasiswas?.length}/{p.kuota}):
                                            <div className="mt-1.5 flex flex-wrap gap-2">
                                                {p.mahasiswas?.length > 0 ? (
                                                    p.mahasiswas.map((m: any) => (
                                                        <span
                                                            key={m.id}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-bold text-foreground"
                                                        >
                                                            {m.name}
                                                            {roleFlags?.isPanitia &&
                                                                p.status === 'Draft Plotting' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDetachMember(
                                                                                p.id,
                                                                                m.id,
                                                                                m.name,
                                                                            )
                                                                        }
                                                                        title="Keluarkan dari draft tim"
                                                                        className="text-rose-500 hover:text-rose-700"
                                                                    >
                                                                        <UserMinus size={13} />
                                                                    </button>
                                                                )}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-bold text-rose-500">
                                                        BELUM ADA TIM
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {p.pembimbings?.map((pb: any) => (
                                                <span
                                                    key={pb.id}
                                                    className="rounded bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground"
                                                >
                                                    Pembimbing {pb.role}: {pb.dosen?.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {roleFlags?.isPanitia && p.status === 'Draft Plotting' && (
                                        <div className="h-max w-full shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 md:w-64">
                                            <label className="mb-1.5 block text-[10px] font-bold text-amber-800 uppercase dark:text-amber-300">
                                                Manual Override Tambah Tim
                                            </label>
                                            <select
                                                id={`override-${p.id}`}
                                                className="mb-2 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                            >
                                                <option value="">-- Pilih Mahasiswa --</option>
                                                {mahasiswas.map((m: any) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const sel = document.getElementById(
                                                        `override-${p.id}`,
                                                    ) as HTMLSelectElement;
                                                    handleOverride(p.id, sel.value);
                                                }}
                                                className="w-full rounded-lg bg-amber-600 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
                                            >
                                                Tambahkan ke Tim
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ===================================================================== */}
                {/* TAB 4: APPROVAL KAPRODI                                               */}
                {/* ===================================================================== */}
                {activeTab === 'approval' && roleFlags?.isPanitia && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
                            Verifikasi pengajuan judul <strong>Jalur Mandiri</strong> yang diajukan oleh Mahasiswa sebelum masuk ke tahap bimbingan.
                        </div>

                        {pendingProjects.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                                Tidak ada pengajuan mandiri yang menunggu approval.
                            </div>
                        ) : (
                            pendingProjects.map((p: any) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs md:flex-row md:items-center"
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{p.judul}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {p.deskripsi}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Diajukan oleh:{' '}
                                            <strong className="text-foreground">
                                                {p.pengusul?.name}
                                            </strong>{' '}
                                            (Jalur Mandiri)
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => approveMandiri(p.id)}
                                        className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700"
                                    >
                                        <ShieldCheck size={16} /> ACC Judul Mandiri
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

TemaMatchmaking.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);