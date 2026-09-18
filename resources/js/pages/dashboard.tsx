import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    GraduationCap, 
    MessageSquareText, 
    FileText, 
    CalendarDays, 
    CheckCircle2, 
    ArrowRight, 
    MoreHorizontal,
    Clock
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'TA Management',
        href: '/dashboard',
    },
    {
        title: 'Overview',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Overview TA" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
                
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 uppercase">
                            Senin, 14 September 2026
                        </p>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">
                            Ringkasan pengelolaan TA.
                        </h1>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                            Monitor aktivitas dan progres tugas akhir minggu ini.
                        </p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors w-full md:w-auto">
                        <CalendarDays size={16} /> Kelola jadwal
                    </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Highlight Card */}
                    <div className="bg-blue-600 dark:bg-blue-700 text-white p-5 rounded-xl shadow-sm border border-blue-600 dark:border-blue-700 flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <div className="bg-blue-500/50 p-2 rounded-lg">
                                <GraduationCap size={20} className="text-white" />
                            </div>
                            <MoreHorizontal size={18} className="text-blue-200" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">12</h2>
                            <p className="text-sm text-blue-100 mt-1">4 perlu perhatian</p>
                        </div>
                    </div>

                    {/* Standard Card 1 */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
                            <p className="text-sm font-medium">Total bimbingan</p>
                            <MessageSquareText size={18} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">
                                23<span className="text-base font-normal text-slate-500 dark:text-zinc-400 ml-1">sesi</span>
                            </h2>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                +2 sesi bulan ini
                            </p>
                        </div>
                    </div>

                    {/* Standard Card 2 */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
                            <p className="text-sm font-medium">Dokumen disetujui</p>
                            <FileText size={18} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">
                                8<span className="text-base font-normal text-slate-500 dark:text-zinc-400 ml-1">/ 9</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                                1 dokumen perlu revisi
                            </p>
                        </div>
                    </div>

                    {/* Standard Card 3 */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400">
                            <p className="text-sm font-medium">Sidang minggu ini</p>
                            <CalendarDays size={18} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">3</h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                                18–20 Juni 2025
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Timeline Column */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                                Milestone tugas akhir
                            </h2>
                            <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                                Lihat detail <ArrowRight size={14} />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { title: 'Proposal disetujui', date: '12 Feb 2025', done: true, pending: false },
                                { title: 'Seminar proposal', date: '28 Feb 2025', done: true, pending: false },
                                { title: 'Pelaksanaan penelitian', date: 'Mar — Mei 2025', done: true, pending: false },
                                { title: 'Sidang tugas akhir', date: '18 Jun 2025', done: false, pending: true },
                            ].map((step, idx) => (
                                <div key={idx} className="flex gap-4 relative">
                                    {/* Vertical Line */}
                                    {idx < 3 && (
                                        <div className="absolute left-[11px] top-7 bottom-[-20px] w-[2px] bg-slate-100 dark:bg-zinc-800"></div>
                                    )}
                                    
                                    {/* Indicator Circle */}
                                    <div className="relative z-10 bg-white dark:bg-zinc-900 pt-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                            step.done 
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                                : step.pending
                                                    ? 'border-blue-500 bg-blue-500 text-white'
                                                    : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800'
                                        }`}>
                                            {step.done ? <CheckCircle2 size={14} /> : (step.pending ? <span className="w-2 h-2 rounded-full bg-white"></span> : '')}
                                        </div>
                                    </div>
                                    
                                    {/* Text Content */}
                                    <div className="flex-1 pb-1 flex justify-between items-start">
                                        <div>
                                            <h3 className={`text-sm font-semibold ${step.pending ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-700 dark:text-zinc-300'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                                                {step.date}
                                            </p>
                                        </div>
                                        {step.pending && (
                                            <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded">
                                                Berikutnya
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity Column */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                                Bimbingan terakhir
                            </h2>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>

                        <div className="space-y-5 flex-1">
                            {/* Activity Item 1 */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <MessageSquareText size={16} />
                                </div>
                                <div className="border-b border-slate-100 dark:border-zinc-800 pb-5 w-full">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Review progres implementasi</h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                        Revisi modul akuisisi data dan tambahkan pengujian reliabilitas.
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-medium">
                                        <Clock size={12} /> 11 JUN
                                    </div>
                                </div>
                            </div>

                            {/* Activity Item 2 */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <MessageSquareText size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Validasi metodologi penelitian</h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                        Metode eksperimen disetujui dengan beberapa catatan minor.
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-medium">
                                        <Clock size={12} /> 04 JUN
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800">
                            <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                                Buka ruang bimbingan <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Menggunakan pola Persistent Layout agar tidak terjadi double-wrapping
Dashboard.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);