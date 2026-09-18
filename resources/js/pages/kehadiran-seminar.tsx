import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ClipboardCheck, CalendarDays, CheckCircle2, QrCode } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Kehadiran Seminar', href: '/kehadiran-seminar' },
];

const seminarList = [
    { title: 'Seminar proposal · Sistem otomasi', date: '06 Jun 2025', location: 'Ruang Auditorium' },
    { title: 'Seminar hasil · Analisis kualitas', date: '30 Mei 2025', location: 'Ruang Auditorium' },
    { title: 'Seminar teknologi manufaktur', date: '23 Mei 2025', location: 'Lab Komputasi' },
    { title: 'Seminar kewirausahaan', date: '16 Mei 2025', location: 'Aula Utama' },
    { title: 'Seminar keselamatan kerja', date: '09 Mei 2025', location: 'Ruang Seminar 2' },
];

export default function KehadiranSeminar() {
    return (
        <>
            <Head title="Kehadiran Seminar Tugas Akhir" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 uppercase">Syarat Akademik</p>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Kehadiran seminar</h1>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Kumpulkan minimal 5 presensi seminar proposal sebelum mendaftar sidang.</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                        <QrCode size={16} /> Scan QR seminar
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-600 text-white p-5 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-blue-100 font-medium">Presensi terkumpul</p>
                            <ClipboardCheck size={18} className="text-blue-200" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">5 <span className="text-sm font-normal text-blue-200">/ 5</span></h2>
                        <div className="w-full bg-blue-800 rounded-full h-1.5 mb-1.5">
                            <div className="bg-white h-1.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-[10px] text-blue-100">Syarat minimum terpenuhi</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Total seminar</p>
                            <CalendarDays size={18} className="text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">8</h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">3 presensi tambahan</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Presensi terakhir</p>
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">06 Jun</h2>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Terverifikasi panitia</p>
                    </div>
                </div>

                {/* Attendance History List */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">RIWAYAT PRESENSI</p>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Seminar yang dihadiri</h2>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Eligible
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {seminarList.map((item, idx) => (
                            <div key={idx} className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        ✓
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{item.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{item.date} · {item.location}</p>
                                    </div>
                                </div>

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    Terverifikasi
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}

KehadiranSeminar.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);