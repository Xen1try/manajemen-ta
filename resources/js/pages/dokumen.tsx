import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FileText, CheckCircle2, Clock3, MoreHorizontal, Upload } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Dokumen TA', href: '/dokumen' },
];

const docs = [
    { name: 'Proposal Tugas Akhir', type: 'PDF · 2.4 MB', status: 'Disetujui', tone: 'emerald' },
    { name: 'Laporan Bab 1–3', type: 'PDF · 5.8 MB', status: 'Disetujui', tone: 'emerald' },
    { name: 'Laporan Bab 4–5', type: 'PDF · 3.1 MB', status: 'Perlu revisi', tone: 'rose' },
    { name: 'Surat Pernyataan Orisinalitas', type: 'PDF · Belum diunggah', status: 'Menunggu', tone: 'amber' },
];

export default function Dokumen() {
    return (
        <>
            <Head title="Dokumen Tugas Akhir" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 uppercase">Arsip Digital</p>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Dokumen tugas akhir</h1>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Kelola versi dokumen, status persetujuan, dan checklist persiapan sidang.</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                        <Upload size={16} /> Unggah dokumen
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-600 text-white p-5 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-blue-100 font-medium">Kelengkapan dokumen</p>
                            <FileText size={18} className="text-blue-200" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">8 <span className="text-sm font-normal text-blue-200">/ 9</span></h2>
                        <div className="w-full bg-blue-800 rounded-full h-1.5 mb-1.5">
                            <div className="bg-white h-1.5 rounded-full" style={{ width: '89%' }}></div>
                        </div>
                        <p className="text-[10px] text-blue-100">89% siap untuk sidang</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Disetujui</p>
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">8</h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Dokumen telah divalidasi</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Perlu revisi</p>
                            <Clock3 size={18} className="text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">1</h2>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Segera perbaiki catatan</p>
                    </div>
                </div>

                {/* Document List Panel */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">CHECKLIST SIDANG</p>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Dokumen persyaratan</h2>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {docs.map((doc, idx) => (
                            <div key={idx} className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{doc.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{doc.type}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        doc.tone === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                        doc.tone === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                                    }`}>
                                        {doc.status}
                                    </span>
                                    <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1">
                                        {doc.status === 'Menunggu' ? 'Unggah' : 'Lihat'}
                                    </button>
                                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}

Dokumen.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);