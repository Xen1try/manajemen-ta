import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BookOpen, Database, GraduationCap, Library, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Data Master', href: '/master-data' },
];

export default function MasterData({
    prodis = [],
    competencies = [],
    jabatans = [],
}: any) {
    const { currentTeam } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;

    const formProdi = useForm({ name: '', code: '' });
    const formComp = useForm({ name: '', code: '' });
    const formJabatan = useForm({ name: '', weight_score: 1, max_kuota_bimbingan: 8 });

    const submitProdi = (e: React.FormEvent) => {
        e.preventDefault();
        formProdi.post(`${baseUrl}/master-data/prodi`, {
            preserveScroll: true,
            onSuccess: () => formProdi.reset(),
        });
    };

    const submitComp = (e: React.FormEvent) => {
        e.preventDefault();
        formComp.post(`${baseUrl}/master-data/competency`, {
            preserveScroll: true,
            onSuccess: () => formComp.reset(),
        });
    };

    const submitJabatan = (e: React.FormEvent) => {
        e.preventDefault();
        formJabatan.post(`${baseUrl}/master-data/jabatan`, {
            preserveScroll: true,
            onSuccess: () => formJabatan.reset(),
        });
    };

    const del = (path: string) => {
        if (confirm('Hapus data master ini?')) {
            router.delete(`${baseUrl}/${path}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Data Master Sistem" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="border-b border-border pb-5">
                    <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                        Referensi Pusat Akademik
                    </p>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        <Database className="text-primary" size={26} />
                        Data Master Sistem
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola referensi Program Studi, Skill Vector (Kompetensi), dan Bobot serta Kuota Jabatan Fungsional dosen.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Panel 1: Program Studi */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex items-center justify-between border-b border-border bg-secondary/40 p-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Library size={17} className="text-primary" />
                                Program Studi
                            </div>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                {prodis.length}
                            </span>
                        </div>

                        <div className="max-h-72 flex-1 divide-y divide-border overflow-y-auto">
                            {prodis.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada data Program Studi.
                                </div>
                            ) : (
                                prodis.map((p: any) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between px-4 py-3 text-xs transition-colors hover:bg-muted/40"
                                    >
                                        <div>
                                            <span className="font-semibold text-foreground">
                                                {p.name}
                                            </span>
                                            <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                                                {p.code}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => del(`master-data/prodi/${p.id}`)}
                                            className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-500/10"
                                            title="Hapus Prodi"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={submitProdi}
                            className="flex flex-col gap-2.5 border-t border-border bg-secondary/30 p-4"
                        >
                            <input
                                type="text"
                                placeholder="Kode Prodi (cth: TRII)"
                                value={formProdi.data.code}
                                onChange={(e) => formProdi.setData('code', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Nama Program Studi"
                                value={formProdi.data.name}
                                onChange={(e) => formProdi.setData('name', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            />
                            <button
                                type="submit"
                                disabled={formProdi.processing}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus size={14} /> Tambah Prodi
                            </button>
                        </form>
                    </div>

                    {/* Panel 2: Kompetensi / Skill Vector */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex items-center justify-between border-b border-border bg-secondary/40 p-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <BookOpen size={17} className="text-emerald-600 dark:text-emerald-400" />
                                Skill Vector (Kompetensi)
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {competencies.length}
                            </span>
                        </div>

                        <div className="max-h-72 flex-1 divide-y divide-border overflow-y-auto">
                            {competencies.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada data Kompetensi.
                                </div>
                            ) : (
                                competencies.map((c: any) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between px-4 py-3 text-xs transition-colors hover:bg-muted/40"
                                    >
                                        <div>
                                            <span className="font-semibold text-foreground">
                                                {c.name}
                                            </span>
                                            <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                                                {c.code}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => del(`master-data/competency/${c.id}`)}
                                            className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-500/10"
                                            title="Hapus Kompetensi"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={submitComp}
                            className="flex flex-col gap-2.5 border-t border-border bg-secondary/30 p-4"
                        >
                            <input
                                type="text"
                                placeholder="Kode Key (cth: iot_embedded)"
                                value={formComp.data.code}
                                onChange={(e) => formComp.setData('code', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Nama Kompetensi / Keahlian"
                                value={formComp.data.name}
                                onChange={(e) => formComp.setData('name', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            />
                            <button
                                type="submit"
                                disabled={formComp.processing}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus size={14} /> Tambah Skill
                            </button>
                        </form>
                    </div>

                    {/* Panel 3: Jabatan Fungsional */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="flex items-center justify-between border-b border-border bg-secondary/40 p-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <GraduationCap size={17} className="text-amber-600 dark:text-amber-400" />
                                Jabatan Fungsional
                            </div>
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                {jabatans.length}
                            </span>
                        </div>

                        <div className="max-h-72 flex-1 divide-y divide-border overflow-y-auto">
                            {jabatans.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada data Jabatan Fungsional.
                                </div>
                            ) : (
                                jabatans.map((j: any) => (
                                    <div
                                        key={j.id}
                                        className="flex items-center justify-between px-4 py-3 text-xs transition-colors hover:bg-muted/40"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-semibold text-foreground">{j.name}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                                    Bobot: {j.weight_score}
                                                </span>
                                                {j.max_kuota_bimbingan && (
                                                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        Kuota: {j.max_kuota_bimbingan} mhs
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => del(`master-data/jabatan/${j.id}`)}
                                            className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-500/10"
                                            title="Hapus Jabatan"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={submitJabatan}
                            className="flex flex-col gap-2.5 border-t border-border bg-secondary/30 p-4"
                        >
                            <input
                                type="text"
                                placeholder="Nama Jabatan (cth: Lektor Kepala)"
                                value={formJabatan.data.name}
                                onChange={(e) => formJabatan.setData('name', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                                        Bobot Menguji
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formJabatan.data.weight_score}
                                        onChange={(e) =>
                                            formJabatan.setData(
                                                'weight_score',
                                                parseInt(e.target.value, 10) || 1,
                                            )
                                        }
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                                        Maks. Kuota Bimbing
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formJabatan.data.max_kuota_bimbingan}
                                        onChange={(e) =>
                                            formJabatan.setData(
                                                'max_kuota_bimbingan',
                                                parseInt(e.target.value, 10) || 1,
                                            )
                                        }
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={formJabatan.processing}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus size={14} /> Tambah Jabatan
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

MasterData.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;