import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BookOpen, CheckCircle2, Sparkles, ClipboardCheck } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Pengajuan Judul', href: '/pengajuan-judul' },
];

const titleSubmissions = [
    { student: 'Maulana Rizky', type: 'Tipe 2 · Tema mandiri', title: 'Sistem monitoring kualitas produksi berbasis IoT', status: 'Menunggu Kaprodi', tone: 'amber', date: '11 Jun 2025' },
    { student: 'Dhea Anindita', type: 'Tipe 1 · Tema dosen', title: 'Optimasi jig untuk proses drilling', status: 'Disetujui', tone: 'emerald', date: '09 Jun 2025' },
    { student: 'Nadia Putri', type: 'Tipe 3 · Kemitraan industri', title: 'Prediksi downtime mesin CNC', status: 'Perlu revisi', tone: 'rose', date: '07 Jun 2025' },
];

export default function PengajuanJudul() {
    return (
        <>
            <Head title="Pengajuan Judul Tugas Akhir" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 uppercase">Workflow Mahasiswa</p>
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Pengajuan judul tugas akhir</h1>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Ajukan tema mandiri, pilih tema dosen, atau daftarkan tema kemitraan industri.</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                        <Sparkles size={16} /> Buat pengajuan baru
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-600 text-white p-5 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-blue-100 font-medium">Status pengajuan</p>
                            <BookOpen size={18} className="text-blue-200" />
                        </div>
                        <h2 className="text-3xl font-bold mb-1">1</h2>
                        <p className="text-xs text-blue-100">Pengajuan aktif · menunggu verifikasi</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Presensi seminar</p>
                            <ClipboardCheck size={18} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">5 <span className="text-sm font-normal text-slate-400">/ 5</span></h2>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Syarat seminar terpenuhi</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800">
                        <div className="flex justify-between items-start text-slate-500 dark:text-zinc-400 mb-2">
                            <p className="text-sm font-medium">Similarity check</p>
                            <Sparkles size={18} className="text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">18%</h2>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Di bawah batas maksimal 25%</p>
                    </div>
                </div>

                {/* Grid Form & Workflow */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Form Panel */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">FORM PENGAJUAN</p>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Draft pengajuan baru</h2>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500">Draft</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Jenis tema</label>
                                    <select className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:ring-blue-500 focus:border-blue-500">
                                        <option>Tipe 2 · Tema mahasiswa</option>
                                        <option>Tipe 1 · Tema dosen</option>
                                        <option>Tipe 3 · Kemitraan industri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Judul tugas akhir</label>
                                    <input type="text" className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:ring-blue-500 focus:border-blue-500" defaultValue="Sistem monitoring kualitas produksi berbasis IoT" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Deskripsi singkat</label>
                                    <textarea rows={3} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 focus:ring-blue-500 focus:border-blue-500" defaultValue="Rancang bangun sistem monitoring kualitas produksi dengan sensor terhubung."></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                            <button className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">Simpan draft</button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Kirim pengajuan →</button>
                        </div>
                    </div>

                    {/* Progress Workflow */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">ALUR VERIFIKASI</p>
                            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-6">Progress pengajuan</h2>

                            <div className="space-y-6 relative">
                                <div className="absolute left-[13px] top-6 bottom-6 w-[2px] bg-slate-100 dark:bg-zinc-800"></div>
                                
                                <div className="flex gap-4 relative z-10">
                                    <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">✓</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Draft disiapkan</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">11 Juni 2025 · mahasiswa</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative z-10">
                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Verifikasi Kaprodi</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Menunggu review dan persetujuan</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative z-10">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Penetapan pembimbing</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Aktif setelah judul disetujui</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <p className="text-xs text-emerald-800 dark:text-emerald-300">Prasyarat terpenuhi: 5 presensi seminar dan similarity 18%.</p>
                        </div>
                    </div>

                </div>

                {/* Submissions History Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider">RIWAYAT PENGAJUAN</p>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Pengajuan judul mahasiswa</h2>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {titleSubmissions.map((item, idx) => (
                            <div key={idx} className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        {item.student.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{item.student}</h3>
                                            <span className="text-xs text-slate-400">· {item.date}</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 mt-0.5 truncate">{item.title}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{item.type}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        item.tone === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                        item.tone === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
                                    }`}>
                                        {item.status}
                                    </span>
                                    <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Detail →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}

PengajuanJudul.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        {page}
    </AppLayout>
);