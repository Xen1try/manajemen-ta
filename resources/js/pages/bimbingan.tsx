import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    MessageSquareText, 
    CheckCircle2, 
    Clock3, 
    FileText, 
    UsersRound, 
    ArrowRight 
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Bimbingan', href: '/bimbingan' },
];

export default function Bimbingan({ bimbingans }: { bimbingans: any[] }) {
    const { currentTeam } = usePage().props as any;

    const { data, setData, post, processing, reset, errors } = useForm({
        date: new Date().toISOString().split('T')[0],
        lecturer_name: '', // Default atau input kosong
        topic: '',
        notes: '',
        next_action: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const storeUrl = `/${currentTeam.slug}/bimbingan`;
        
        post(storeUrl, {
            onSuccess: () => reset('topic', 'notes', 'next_action'),
        });
    };

    return (
        <>
            <Head title="Ruang Bimbingan" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 uppercase">
                        Ruang Bimbingan
                    </p>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">
                        Catat hasil bimbingan
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1 max-w-2xl">
                        Catat hasil diskusi dan dosen pembimbing terkait agar riwayat TA terdokumentasi dengan rapi.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* List Riwayat Bimbingan */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">RIWAYAT TERDOKUMENTASI</p>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Riwayat bimbingan ({bimbingans.length})</h2>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {bimbingans.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Belum ada catatan bimbingan.
                                </div>
                            ) : (
                                bimbingans.map((item) => (
                                    <div key={item.id} className="p-5 flex gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg p-2 text-center h-min min-w-[60px]">
                                            <strong className="block text-lg leading-tight">{item.date.split('-')[2]}</strong>
                                            <small className="text-[10px] font-bold uppercase tracking-wider">
                                                {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][parseInt(item.date.split('-')[1]) - 1]}
                                            </small>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">{item.topic}</h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed">
                                                {item.notes}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-medium">
                                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                                    <UsersRound size={12} /> {item.lecturer_name}
                                                </span>
                                                <span className="flex items-center gap-1">Tindak lanjut: <span className="text-slate-600 dark:text-zinc-300">{item.next_action}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Form Input dengan Kolom Dosen Pembimbing */}
                    <div className="space-y-6">
                        <form onSubmit={submit} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">DOKUMENTASI MANDIRI</p>
                                <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Catat hasil bimbingan</h2>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Tanggal diskusi</label>
                                <input 
                                    type="date" 
                                    value={data.date} 
                                    onChange={e => setData('date', e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" 
                                />
                                {errors.date && <span className="text-xs text-rose-500 mt-1 block">{errors.date}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Dosen Pembimbing</label>
                                <input 
                                    type="text" 
                                    value={data.lecturer_name} 
                                    onChange={e => setData('lecturer_name', e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" 
                                    placeholder="Nama Dosen Pembimbing" 
                                />
                                {errors.lecturer_name && <span className="text-xs text-rose-500 mt-1 block">{errors.lecturer_name}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Topik diskusi</label>
                                <input 
                                    type="text" 
                                    value={data.topic} 
                                    onChange={e => setData('topic', e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" 
                                    placeholder="Misal: Review Bab 1" 
                                />
                                {errors.topic && <span className="text-xs text-rose-500 mt-1 block">{errors.topic}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Hasil & arahan</label>
                                <textarea 
                                    rows={3} 
                                    value={data.notes} 
                                    onChange={e => setData('notes', e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" 
                                    placeholder="Tuliskan keputusan atau revisi..."
                                ></textarea>
                                {errors.notes && <span className="text-xs text-rose-500 mt-1 block">{errors.notes}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Langkah berikutnya</label>
                                <input 
                                    type="text" 
                                    value={data.next_action} 
                                    onChange={e => setData('next_action', e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" 
                                    placeholder="Target selanjutnya" 
                                />
                                {errors.next_action && <span className="text-xs text-rose-500 mt-1 block">{errors.next_action}</span>}
                            </div>

                            <button 
                                type="submit" 
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors mt-2 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan hasil bimbingan'} <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </>
    );
}

Bimbingan.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);