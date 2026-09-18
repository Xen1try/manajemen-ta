import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BookOpen, Users, Lock, Unlock, AlertCircle, CheckCircle2, Play, GitPullRequest } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Bursa & Pengajuan Judul', href: '/bursa-ta' },
];

export default function BursaTA({ projects = [], bursaSelection, dosens = [], mahasiswas = [], roleFlags }: any) {
    const { currentTeam, timeline } = usePage().props as any;
    const [activeTab, setActiveTab] = useState('bursa');

    // Form akan TERBUKA jika masuk fase pembagian_tema ATAU jika user adalah Panitia (Override)
    const isTemaBuka = timeline?.activePhases?.includes('pembagian_tema') || timeline?.isAdminOverride;

    // Filter proyek berdasarkan tab
    const bursaProjects = projects.filter((p: any) => p.status === 'Bursa');
    const assignedProjects = projects.filter((p: any) => ['Draft Plotting', 'Assigned'].includes(p.status));

    // Form Pengajuan Judul Baru
    const formPengajuan = useForm({
        tipe: roleFlags.isDosen ? 'Tipe 2' : 'Mandiri',
        judul: '',
        deskripsi: '',
        required_skills: [] as string[],
        mahasiswa_id: '',
        pembimbing_ids: [''], // Default 1 pembimbing
    });

    // Form Pemilihan Bursa (Mahasiswa)
    const formBursa = useForm({
        pilihan_1_id: bursaSelection?.pilihan_1_id || '',
        pilihan_2_id: bursaSelection?.pilihan_2_id || '',
        pilihan_3_id: bursaSelection?.pilihan_3_id || '',
    });

    const submitPengajuan = (e: React.FormEvent) => {
        e.preventDefault();
        formPengajuan.post(`/${currentTeam.slug}/ta-projects`, { onSuccess: () => formPengajuan.reset() });
    };

    const submitBursa = (e: React.FormEvent) => {
        e.preventDefault();
        formBursa.post(`/${currentTeam.slug}/bursa/lock`);
    };

    const runAlgorithm = () => {
        if(confirm('Jalankan algoritma matchmaking? Ini akan mereset hasil draft sebelumnya.')) {
            router.post(`/${currentTeam.slug}/bursa/run-algorithm`);
        }
    };

    const handleOverride = (projectId: number, mahasiswaId: string) => {
        if(!mahasiswaId) return;
        if(confirm('Tetapkan mahasiswa ini secara paksa (Override)?')) {
            router.post(`/${currentTeam.slug}/bursa/${projectId}/override`, { mahasiswa_id: mahasiswaId }, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Bursa & Pengajuan TA" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
                {/* === BANNER GATEKEEPER === */}
                <div className={`p-4 rounded-xl border flex items-start gap-4 ${isTemaBuka ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <div className={`p-2 rounded-full shrink-0 ${isTemaBuka ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isTemaBuka ? <Unlock size={20} /> : <Lock size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">
                            {isTemaBuka ? 'Fase Pembagian Tema DIBUKA' : 'Fase Pembagian Tema DITUTUP'}
                        </h3>
                        <p className="text-xs mt-1 opacity-80">
                            {isTemaBuka 
                                ? 'Anda dapat mengajukan judul baru atau memilih dari bursa (Matchmaking).' 
                                : 'Timeline akademik saat ini tidak berada pada fase pengajuan judul. Fitur input dikunci otomatis.'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Bursa & Pengajuan Judul</h1>
                    {roleFlags.isPanitia && (
                        <button onClick={runAlgorithm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow">
                            <Play size={16}/> Jalankan Matchmaking
                        </button>
                    )}
                </div>

                {/* TABS */}
                <div className="flex gap-1 border-b border-slate-200 dark:border-zinc-800 pb-1">
                    <button onClick={() => setActiveTab('bursa')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'bursa' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}><BookOpen size={16}/> Bursa Matchmaking (Tipe 2)</button>
                    <button onClick={() => setActiveTab('pengajuan')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'pengajuan' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}><GitPullRequest size={16}/> Buat Pengajuan Baru</button>
                    <button onClick={() => setActiveTab('hasil')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'hasil' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Hasil Plotting & Assigned</button>
                </div>

                {/* KONTEN TAB: BURSA MATCHMAKING */}
                {activeTab === 'bursa' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            {bursaProjects.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">Belum ada judul Tipe 2 di bursa.</div>
                            ) : (
                                bursaProjects.map((p: any) => (
                                    <div key={p.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 shadow-sm relative">
                                        <span className="absolute top-4 right-4 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">ID: {p.id}</span>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{p.judul}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{p.deskripsi}</p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                            <span className="flex items-center gap-1"><Users size={14}/> Pengusul: {p.pengusul?.name}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Keranjang Pemilihan Khusus Mahasiswa */}
                        {roleFlags.isMahasiswa && (
                            <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 h-max sticky top-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Keranjang Pilihan Anda</h3>
                                
                                {bursaSelection?.status === 'Locked' || bursaSelection?.status === 'Matched' ? (
                                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-bold border border-emerald-200 text-center">
                                        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50"/>
                                        Pilihan sudah dikunci! <br/>
                                        <span className="text-xs font-normal">Status: {bursaSelection.status}</span>
                                    </div>
                                ) : (
                                    <form onSubmit={submitBursa} className="space-y-4">
                                        {[1, 2, 3].map(num => (
                                            <div key={num}>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Pilihan Prioritas {num}</label>
                                                <select 
                                                    disabled={!isTemaBuka}
                                                    value={formBursa.data[`pilihan_${num}_id` as keyof typeof formBursa.data] as string} 
                                                    onChange={e => formBursa.setData(`pilihan_${num}_id` as any, e.target.value)} 
                                                    className="w-full text-xs rounded border-slate-200"
                                                    required
                                                >
                                                    <option value="">-- Pilih Judul (ID) --</option>
                                                    {bursaProjects.map((p: any) => <option key={p.id} value={p.id}>[{p.id}] {p.judul.substring(0, 40)}...</option>)}
                                                </select>
                                            </div>
                                        ))}
                                        <div className="pt-2">
                                            <p className="text-[10px] text-slate-500 mb-2 leading-tight">Sistem Matchmaking bersifat First-Come-First-Serve dan mempertimbangkan relevansi Skill Anda. Kunci pilihan jika sudah yakin.</p>
                                            <button type="submit" disabled={!isTemaBuka || formBursa.processing} className="w-full bg-blue-600 disabled:bg-slate-300 text-white font-bold py-2 rounded-lg text-sm">
                                                Kunci Pilihan Saya
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* KONTEN TAB: PENGAJUAN BARU */}
                {activeTab === 'pengajuan' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 p-6 max-w-2xl relative overflow-hidden">
                        {!isTemaBuka && (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                                <Lock size={32} className="text-slate-400 mb-2"/>
                                <p className="text-sm font-bold">Form Terkunci oleh Gatekeeper</p>
                            </div>
                        )}
                        <form onSubmit={submitPengajuan} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tipe Pengajuan</label>
                                <select value={formPengajuan.data.tipe} onChange={e => formPengajuan.setData('tipe', e.target.value)} className="w-full text-sm rounded border-slate-200">
                                    {roleFlags.isDosen && <option value="Tipe 1">Tipe 1 (Penunjukan Langsung)</option>}
                                    {roleFlags.isDosen && <option value="Tipe 2">Tipe 2 (Dilempar ke Bursa Matchmaking)</option>}
                                    {roleFlags.isMahasiswa && <option value="Mandiri">Mandiri (Judul Bawaan Mahasiswa)</option>}
                                </select>
                            </div>
                            
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Judul Tugas Akhir</label><input type="text" value={formPengajuan.data.judul} onChange={e => formPengajuan.setData('judul', e.target.value)} className="w-full text-sm rounded border-slate-200" required/></div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Singkat</label><textarea value={formPengajuan.data.deskripsi} onChange={e => formPengajuan.setData('deskripsi', e.target.value)} className="w-full text-sm rounded border-slate-200 h-24" required></textarea></div>

                            {formPengajuan.data.tipe === 'Tipe 1' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tunjuk Mahasiswa</label>
                                    <select value={formPengajuan.data.mahasiswa_id} onChange={e => formPengajuan.setData('mahasiswa_id', e.target.value)} className="w-full text-sm rounded border-slate-200" required>
                                        <option value="">-- Pilih Mahasiswa --</option>
                                        {mahasiswas.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Dosen Pembimbing (Bisa lebih dari 1)</label>
                                {formPengajuan.data.pembimbing_ids.map((id, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <select value={id} onChange={e => {
                                            const newIds = [...formPengajuan.data.pembimbing_ids];
                                            newIds[index] = e.target.value;
                                            formPengajuan.setData('pembimbing_ids', newIds);
                                        }} className="flex-1 text-sm rounded border-slate-200" required>
                                            <option value="">-- Pilih Pembimbing {index === 0 ? 'Utama' : 'Pendamping'} --</option>
                                            {dosens.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        {index > 0 && (
                                            <button type="button" onClick={() => {
                                                const newIds = formPengajuan.data.pembimbing_ids.filter((_, i) => i !== index);
                                                formPengajuan.setData('pembimbing_ids', newIds);
                                            }} className="px-3 bg-rose-100 text-rose-600 rounded">X</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => formPengajuan.setData('pembimbing_ids', [...formPengajuan.data.pembimbing_ids, ''])} className="text-xs font-bold text-blue-600 mt-1">+ Tambah Pembimbing Lain</button>
                            </div>

                            <button type="submit" disabled={formPengajuan.processing} className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg text-sm mt-4">Kirim Pengajuan</button>
                        </form>
                    </div>
                )}

                {/* KONTEN TAB: HASIL PLOTTING & ASSIGNED */}
                {activeTab === 'hasil' && (
                    <div className="space-y-4">
                        {assignedProjects.map((p: any) => (
                            <div key={p.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block ${p.status === 'Draft Plotting' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        Status: {p.status}
                                    </span>
                                    <h3 className="font-bold text-lg">{p.judul}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Dikerjakan oleh: <span className="font-bold text-slate-800 dark:text-white">{p.mahasiswa?.name || 'BELUM DI-PLOT'}</span></p>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {p.pembimbings?.map((pb: any) => (
                                            <span key={pb.id} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">{pb.role}: {pb.dosen?.name}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Area Override (Khusus Panitia jika statusnya Draft) */}
                                {roleFlags.isPanitia && p.status === 'Draft Plotting' && (
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg w-full md:w-64 shrink-0">
                                        <label className="block text-[10px] font-bold text-amber-800 mb-1 uppercase">Manual Override (Panitia)</label>
                                        <select id={`override-${p.id}`} className="w-full text-xs rounded border-amber-300 bg-white mb-2">
                                            <option value="">-- Tukar Mahasiswa --</option>
                                            {mahasiswas.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <button onClick={() => {
                                            const sel = document.getElementById(`override-${p.id}`) as HTMLSelectElement;
                                            handleOverride(p.id, sel.value);
                                        }} className="w-full bg-amber-600 text-white text-xs font-bold py-1.5 rounded">Tetapkan Paksa</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}