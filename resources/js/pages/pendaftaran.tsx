import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CheckCircle2, XCircle, Clock, Send, FileText, Link as LinkIcon, DollarSign } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Pendaftaran Seminar & Sidang', href: '/pendaftaran' },
];

export default function PendaftaranSidang({ registrations = {}, stats = {} }: any) {
    const { currentTeam } = usePage().props as any;
    const [activeTab, setActiveTab] = useState('Sempro');

    const form = useForm({
        milestone_type: activeTab,
        dokumen_kti_link: '',
        dokumen_produk_link: '',
        bukti_pembayaran_link: '',
        jumlah_kehadiran_seminar: 0,
        persentase_produk: 80,
        persentase_kti: 80
    });

    // Perhitungan Kriteria
    const getCriteria = (type: string) => {
        if (type === 'Sidang') {
            return [
                { label: 'Telah melaksanakan Seminar Hasil (Semhas)', met: registrations['Semhas']?.status === 'approved' },
                { label: 'Menghadiri Seminar TA minimal 5 kali', met: form.data.jumlah_kehadiran_seminar >= 5 },
                { label: 'Materi TA (Produk/Alat) berfungsi 100%', met: form.data.persentase_produk === 100 },
                { label: 'KTI disetujui 100% oleh pembimbing', met: form.data.persentase_kti === 100 },
                { label: `Bimbingan Pembimbing 1 (Min. 8x) - Saat ini: ${stats.bimbingan_utama}x`, met: stats.bimbingan_utama >= 8 },
                { label: `Bimbingan Pembimbing 2 (Min. 8x) - Saat ini: ${stats.bimbingan_pendamping}x`, met: stats.bimbingan_pendamping >= 8 },
                { label: 'Pembayaran semester telah lunas', met: form.data.bukti_pembayaran_link.length > 5 }
            ];
        }
        // Sempro & Semhas
        return [
            { label: 'Materi TA (Produk/Eksperimen) berfungsi minimal 80%', met: form.data.persentase_produk >= 80 },
            { label: 'Draft KTI rampung minimal 80%', met: form.data.persentase_kti >= 80 },
            { label: `Bimbingan Pembimbing 1 (Min. 6x) - Saat ini: ${stats.bimbingan_utama}x`, met: stats.bimbingan_utama >= 6 },
            { label: `Bimbingan Pembimbing 2 (Min. 6x) - Saat ini: ${stats.bimbingan_pendamping}x`, met: stats.bimbingan_pendamping >= 6 }
        ];
    };

    const criteria = getCriteria(activeTab);
    const isAllMet = criteria.every(c => c.met);
    const regData = registrations[activeTab];

    const handleSubmit = (e: any) => {
        e.preventDefault();
        form.post(`/${currentTeam?.slug}/pendaftaran`, { preserveScroll: true });
    };

    const renderStatusBadge = (status: string) => {
        if (status === 'approved') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={14}/> Telah Di-ACC & Siap Dijadwalkan</span>;
        if (status === 'pending_pembimbing') return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={14}/> Menunggu ACC Pembimbing</span>;
        return null;
    };

    return (
        <>
            <Head title="Pendaftaran Seminar & Sidang" />
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Daftar Ulang & Evaluasi Kesiapan</h1>
                    <p className="text-slate-500 mt-1">Sistem akan memvalidasi syarat kehadiran dan bimbingan Anda secara otomatis.</p>
                </div>

                <div className="flex gap-2 border-b border-slate-200">
                    {['Sempro', 'Semhas', 'Sidang'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => { 
                                setActiveTab(tab); 
                                form.reset(); 
                                form.setData('milestone_type', tab); // <-- Tambahkan baris ini
                            }} 
                            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            Pendaftaran {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Panel Kiri: Checklist Kriteria */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">Syarat {activeTab}</h3>
                        <ul className="space-y-4">
                            {criteria.map((c, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    {c.met ? <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18}/> : <XCircle className="text-rose-500 shrink-0 mt-0.5" size={18}/>}
                                    <span className={`text-sm ${c.met ? 'text-slate-700' : 'text-slate-500 line-through decoration-rose-300'}`}>{c.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Panel Kanan: Form Pendaftaran / Status */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 p-6 shadow-sm">
                        {regData ? (
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Status Pendaftaran {activeTab}</h3>
                                {renderStatusBadge(regData.status)}
                                {regData.catatan_penolakan && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                                        <strong>Catatan Penolakan:</strong> {regData.catatan_penolakan}
                                    </div>
                                )}
                                <div className="pt-4 space-y-2 text-sm text-slate-600">
                                    <p className="flex items-center gap-2"><LinkIcon size={14}/> <a href={regData.dokumen_kti_link} target="_blank" className="text-blue-600 hover:underline">Draft KTI</a></p>
                                    <p className="flex items-center gap-2"><FileText size={14}/> <a href={regData.dokumen_produk_link} target="_blank" className="text-blue-600 hover:underline">Demo Produk/Alat</a></p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <h3 className="font-bold text-lg mb-2">Formulir Pengajuan</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Progres Produk (%)</label>
                                        <input type="number" min="0" max="100" value={form.data.persentase_produk} onChange={e => form.setData('persentase_produk', Number(e.target.value))} className="w-full text-sm rounded border-slate-300"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Progres KTI (%)</label>
                                        <input type="number" min="0" max="100" value={form.data.persentase_kti} onChange={e => form.setData('persentase_kti', Number(e.target.value))} className="w-full text-sm rounded border-slate-300"/>
                                    </div>
                                </div>

                                {activeTab === 'Sidang' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Hadir Seminar Sebagai Audiens</label>
                                        <input type="number" min="0" value={form.data.jumlah_kehadiran_seminar} onChange={e => form.setData('jumlah_kehadiran_seminar', Number(e.target.value))} className="w-full text-sm rounded border-slate-300"/>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><FileText size={14}/> Link Draft KTI (PDF/GDocs)</label>
                                    <input type="url" required value={form.data.dokumen_kti_link} onChange={e => form.setData('dokumen_kti_link', e.target.value)} className="w-full text-sm rounded border-slate-300" placeholder="https://docs.google.com/..."/>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><LinkIcon size={14}/> Link Demo/Video Produk</label>
                                    <input type="url" required value={form.data.dokumen_produk_link} onChange={e => form.setData('dokumen_produk_link', e.target.value)} className="w-full text-sm rounded border-slate-300" placeholder="https://youtube.com/..."/>
                                </div>

                                {activeTab === 'Sidang' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><DollarSign size={14}/> Bukti Lunas SPP (GDrive Link)</label>
                                        <input type="url" required value={form.data.bukti_pembayaran_link} onChange={e => form.setData('bukti_pembayaran_link', e.target.value)} className="w-full text-sm rounded border-slate-300"/>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={!isAllMet || form.processing} 
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Send size={16}/> {isAllMet ? 'Ajukan Pendaftaran' : 'Penuhi Syarat Untuk Mendaftar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

PendaftaranSidang.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;