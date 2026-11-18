import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    Calendar,
    CheckCircle2,
    Clock,
    Flag,
    Play,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SIMTA', href: '/dashboard' },
    { title: 'Kontrol Timeline', href: '/timeline-kontrol' },
];

// Komponen Row untuk Tiap Fase Timeline
const TimelineRow = ({ item, index, totalItems, teamSlug, moveItem }: any) => {
    const editForm = useForm({
        name: item.name || '',
        start_date: item.start_date ? String(item.start_date).split('T')[0] : '',
        end_date: item.end_date ? String(item.end_date).split('T')[0] : '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.put(`/${teamSlug}/timeline-items/${item.id}`, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (confirm(`Hapus fase "${item.name}"?`)) {
            router.delete(`/${teamSlug}/timeline-items/${item.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/50 md:flex-row md:items-center">
            {/* Tombol Reorder */}
            <div className="top-1/2 -left-11 flex -translate-y-0 gap-1 md:absolute md:-translate-y-1/2 md:flex-col md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    title="Geser ke atas"
                    className="rounded-md border border-border bg-card p-1.5 text-muted-foreground shadow-xs transition hover:border-primary hover:text-primary disabled:opacity-30"
                >
                    <ArrowUp size={13} />
                </button>
                <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === totalItems - 1}
                    title="Geser ke bawah"
                    className="rounded-md border border-border bg-card p-1.5 text-muted-foreground shadow-xs transition hover:border-primary hover:text-primary disabled:opacity-30"
                >
                    <ArrowDown size={13} />
                </button>
            </div>

            <form
                onSubmit={submit}
                className="flex flex-1 flex-col justify-between gap-4 md:flex-row md:items-center"
            >
                <div className="flex min-w-[240px] flex-1 items-center gap-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                        {item.order_index}
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            className="w-full border-0 border-b border-dashed border-border bg-transparent px-0 py-0.5 text-sm font-bold text-foreground focus:border-primary focus:ring-0"
                            required
                        />
                        <p className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            {item.system_code}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex flex-col">
                        <label className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Mulai
                        </label>
                        <input
                            type="date"
                            value={editForm.data.start_date}
                            onChange={(e) => editForm.setData('start_date', e.target.value)}
                            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                        />
                    </div>
                    <span className="mt-4 font-bold text-muted-foreground">–</span>
                    <div className="flex flex-col">
                        <label className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Selesai
                        </label>
                        <input
                            type="date"
                            value={editForm.data.end_date}
                            onChange={(e) => editForm.setData('end_date', e.target.value)}
                            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={editForm.processing || !editForm.isDirty}
                        className={`mt-4 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            editForm.isDirty
                                ? 'bg-primary text-primary-foreground shadow-xs hover:opacity-90'
                                : 'bg-secondary text-muted-foreground opacity-60'
                        }`}
                    >
                        <Save size={13} /> Simpan
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        title="Hapus fase"
                        className="mt-4 rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-500/10"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default function TimelineControl({ academicYears = [] }: any) {
    const { currentTeam } = usePage().props as any;
    const baseUrl = `/${currentTeam?.slug}`;

    const [selectedYearId, setSelectedYearId] = useState<number | null>(
        academicYears.length > 0 ? academicYears[0].id : null,
    );

    const viewYear = academicYears.find((ay: any) => ay.id === selectedYearId);

    const formAY = useForm({ name: '', semester: 'Ganjil' });
    const formNewItem = useForm({ name: '' });

    const submitAY = (e: React.FormEvent) => {
        e.preventDefault();
        formAY.post(`${baseUrl}/academic-years`, { onSuccess: () => formAY.reset() });
    };

    const handleSetActive = (id: number) => {
        if (
            confirm(
                'Aktifkan Tahun Ajaran ini? Ini akan mengubah data default yang tampil di seluruh sistem.',
            )
        ) {
            router.post(`${baseUrl}/academic-years/${id}/set-active`);
        }
    };

    const handleDeleteAY = (id: number) => {
        if (
            confirm(
                'Hapus Tahun Ajaran beserta seluruh Blueprint-nya? Data mahasiswa yang terikat tidak akan terhapus.',
            )
        ) {
            router.delete(`${baseUrl}/academic-years/${id}`);
        }
    };

    const handleGenerateTimeline = (id: number) => {
        router.post(`${baseUrl}/academic-years/${id}/generate-timeline`);
    };

    const submitNewItem = (e: React.FormEvent, timelineId: number) => {
        e.preventDefault();
        formNewItem.post(`${baseUrl}/timelines/${timelineId}/items`, {
            onSuccess: () => formNewItem.reset(),
            preserveScroll: true,
        });
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (!viewYear || !viewYear.timelines[0]) return;
        const items = [...viewYear.timelines[0].items];

        if (direction === 'up' && index > 0) {
            [items[index - 1], items[index]] = [items[index], items[index - 1]];
        } else if (direction === 'down' && index < items.length - 1) {
            [items[index + 1], items[index]] = [items[index], items[index + 1]];
        } else {
            return;
        }

        const payload = items.map((itm, idx) => ({ id: itm.id, order_index: idx + 1 }));
        router.post(
            `${baseUrl}/timelines/${viewYear.timelines[0].id}/reorder`,
            { items: payload },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Kontrol Timeline & Tahun Ajaran" />

            <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="border-b border-border pb-5">
                    <p className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">
                        Siklus Akademik & Gatekeeper
                    </p>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        <Clock className="text-primary" size={26} />
                        Kontrol Timeline & Tahun Ajaran
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Kelola periode tahun ajaran, atur rentang tanggal tiap tahapan Tugas Akhir, dan isolasi data per angkatan.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Panel Kiri: Daftar Tahun Ajaran */}
                    <div className="flex h-max flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                        <div className="border-b border-border bg-secondary/50 p-4">
                            <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
                                Tahun Ajaran
                            </h3>
                        </div>

                        <div className="max-h-80 divide-y divide-border overflow-y-auto">
                            {academicYears.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    Belum ada tahun ajaran terdaftar.
                                </div>
                            ) : (
                                academicYears.map((ay: any) => (
                                    <div
                                        key={ay.id}
                                        onClick={() => setSelectedYearId(ay.id)}
                                        className={`flex cursor-pointer items-center justify-between border-l-4 p-4 transition-colors ${
                                            selectedYearId === ay.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-transparent hover:bg-muted/50'
                                        }`}
                                    >
                                        <div>
                                            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                {ay.name}
                                                {ay.is_active && (
                                                    <CheckCircle2
                                                        size={14}
                                                        className="text-emerald-500"
                                                    />
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Semester {ay.semester}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            {!ay.is_active && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetActive(ay.id);
                                                        }}
                                                        className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-500/10"
                                                        title="Jadikan Tahun Aktif"
                                                    >
                                                        <Flag size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAY(ay.id);
                                                        }}
                                                        className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-500/10"
                                                        title="Hapus Tahun Ajaran"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={submitAY}
                            className="space-y-3 border-t border-border bg-secondary/40 p-4"
                        >
                            <input
                                type="text"
                                placeholder="Cth: 2026/2027"
                                value={formAY.data.name}
                                onChange={(e) => formAY.setData('name', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            />
                            <select
                                value={formAY.data.semester}
                                onChange={(e) => formAY.setData('semester', e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                                required
                            >
                                <option value="Ganjil">Semester Ganjil</option>
                                <option value="Genap">Semester Genap</option>
                            </select>
                            <button
                                type="submit"
                                disabled={formAY.processing}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                            >
                                <Plus size={14} /> Tambah Tahun Ajaran
                            </button>
                        </form>
                    </div>

                    {/* Panel Kanan: Timeline Blueprint */}
                    <div className="lg:col-span-3">
                        {!viewYear ? (
                            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
                                <Calendar size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">
                                    Pilih Tahun Ajaran di panel kiri untuk mengatur linimasa.
                                </p>
                            </div>
                        ) : (
                            <div className="h-full rounded-xl border border-border bg-secondary/30 p-6 md:ml-10 md:p-8">
                                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-end">
                                    <div>
                                        <span
                                            className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                                viewYear.is_active
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {viewYear.is_active
                                                ? 'Sedang Berjalan (Active)'
                                                : 'Arsip (Inactive)'}
                                        </span>
                                        <h2 className="text-xl font-bold text-foreground">
                                            Blueprint: {viewYear.name} ({viewYear.semester})
                                        </h2>
                                    </div>

                                    {(!viewYear.timelines ||
                                        viewYear.timelines.length === 0 ||
                                        viewYear.timelines[0].items.length === 0) && (
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateTimeline(viewYear.id)}
                                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:opacity-90"
                                        >
                                            <Play size={15} /> Generate Default Timeline
                                        </button>
                                    )}
                                </div>

                                {viewYear.timelines &&
                                    viewYear.timelines.length > 0 &&
                                    viewYear.timelines[0].items.length > 0 && (
                                        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-[31px] before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                            {viewYear.timelines[0].items.map(
                                                (item: any, index: number) => (
                                                    <div key={item.id} className="relative z-10">
                                                        <TimelineRow
                                                            item={item}
                                                            index={index}
                                                            totalItems={
                                                                viewYear.timelines[0].items.length
                                                            }
                                                            teamSlug={currentTeam.slug}
                                                            moveItem={moveItem}
                                                        />
                                                    </div>
                                                ),
                                            )}

                                            {/* Row Tambah Fase Baru */}
                                            <div className="relative z-10 pt-3">
                                                <form
                                                    onSubmit={(e) =>
                                                        submitNewItem(e, viewYear.timelines[0].id)
                                                    }
                                                    className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-card p-4"
                                                >
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                                                        <Plus size={15} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Masukkan nama fase baru (Cth: Pelatihan K3)"
                                                        value={formNewItem.data.name}
                                                        onChange={(e) =>
                                                            formNewItem.setData(
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex-1 border-0 border-b border-border bg-transparent px-0 py-1 text-sm text-foreground focus:border-primary focus:ring-0"
                                                        required
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={formNewItem.processing}
                                                        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                                                    >
                                                        Tambah Fase
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

TimelineControl.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;