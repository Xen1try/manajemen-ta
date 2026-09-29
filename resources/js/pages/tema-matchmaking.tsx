import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BookOpen, Users, Lock, Unlock, CheckCircle2, Play, GitPullRequest, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'TA Management', href: '/dashboard' },
    { title: 'Tema & Matchmaking', href: '/tema-matchmaking' },
];

export default function TemaMatchmaking({ projects = [], temaSelection, dosens = [], mahasiswas = [], competencies = [], dosenProfile, roleFlags }: any) {
    const { currentTeam, timeline } = usePage().props as any;
    const [activeTab, setActiveTab] = useState('katalog');

    const isTemaBuka = timeline?.activePhases?.includes('pembagian_tema') || timeline?.isAdminOverride;
    const temaProjects = projects.filter((p: any) => p.status === 'Matchmaking');
    const assignedProjects = projects.filter((p: any) => ['Draft Plotting', 'Assigned'].includes(p.status));
    const pendingProjects = projects.filter((p: any) => p.status === 'Pending Kaprodi');

    // Auto-fill form dengan semua Master Kompetensi (Level default 1)
    const buildInitialSkills = () => {
        return competencies.map((c: any) => ({ name: c.name, level: 1 }));
    };

    const formPengajuan = useForm({
        tipe: roleFlags.isDosen ? 'Tipe 2' : 'Mandiri',
        judul: '',
        deskripsi: '',
        kuota: 1,
        required_skills: buildInitialSkills() as {name: string, level: number}[],
        mahasiswa_ids: [''], 
        pembimbing_ids: [''], 
    });

    const formTema = useForm({
        pilihan_1_id: temaSelection?.pilihan_1_id || '',
        pilihan_2_id: temaSelection?.pilihan_2_id || '',
        pilihan_3_id: temaSelection?.pilihan_3_id || '',
    });

    const handleTarikProfilDosen = () => {
        if(dosenProfile && Array.isArray(dosenProfile.skill_vector)) {
            // Mapping dari profil dosen untuk menyamakan level
            const profSkillsMap = new Map(dosenProfile.skill_vector.map((s:any) => [s.name, s.level]));
            const matchedSkills = competencies.map((c: any) => ({
                name: c.name,
                level: profSkillsMap.has(c.name) ? profSkillsMap.get(c.name) : 1
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
            mahasiswa_ids: data.mahasiswa_ids.filter(id => id !== ''),
            pembimbing_ids: data.pembimbing_ids.filter(id => id !== '')
        }));
        formPengajuan.post(`/${currentTeam.slug}/ta-projects`, { onSuccess: () => formPengajuan.reset() });
    };

    const submitTema = (e: React.FormEvent) => {
        e.preventDefault();
        formTema.post(`/${currentTeam.slug}/tema-matchmaking/lock`);
    };

    const runAlgorithm = () => {
        if(confirm('Jalankan algoritma matchmaking? Ini akan mereset hasil draft sebelumnya.')) {
            router.post(`/${currentTeam.slug}/tema-matchmaking/run-algorithm`);
        }
    };

    const handleOverride = (projectId: number, mahasiswaId: string) => {
        if(!mahasiswaId) return;
        if(confirm('Tetapkan mahasiswa ini secara paksa (Override)? Mahasiswa akan ditambahkan ke tim.')) {
            router.post(`/${currentTeam.slug}/tema-matchmaking/${projectId}/override`, { mahasiswa_id: mahasiswaId }, { preserveScroll: true });
        }
    };

    const approveMandiri = (projectId: number) => {
        if(confirm('Setujui pengajuan judul mandiri ini?')) {
            router.post(`/${currentTeam.slug}/ta-projects/${projectId}/approve`, {}, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Tema & Pengajuan TA" />

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                
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
                                ? 'Anda dapat mengajukan judul baru atau memilih dari katalog tema (Matchmaking).' 
                                : 'Timeline akademik saat ini tidak berada pada fase pengajuan judul. Fitur input dikunci otomatis.'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100">Tema & Pengajuan Judul</h1>
                    {roleFlags.isPanitia && (
                        <button onClick={runAlgorithm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow">
                            <Play size={16}/> Jalankan Matchmaking
                        </button>
                    )}
                </div>

                {/* TABS */}
                <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-zinc-800 pb-1">
                    <button onClick={() => setActiveTab('katalog')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'katalog' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}><BookOpen size={16}/> Katalog Tema</button>
                    <button onClick={() => setActiveTab('pengajuan')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'pengajuan' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}><GitPullRequest size={16}/> Buat Pengajuan</button>
                    <button onClick={() => setActiveTab('hasil')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'hasil' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500'}`}><CheckCircle2 size={16}/> Hasil Plotting</button>
                    {roleFlags.isPanitia && (
                        <button onClick={() => setActiveTab('approval')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'approval' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-slate-500'}`}>
                            <ShieldCheck size={16}/> Approval Kaprodi 
                            {pendingProjects.length > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 rounded-full text-[10px]">{pendingProjects.length}</span>}
                        </button>
                    )}
                </div>

                {/* KONTEN TAB: KATALOG MATCHMAKING */}
                {activeTab === 'katalog' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            {temaProjects.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">Belum ada judul Tipe 2 di katalog.</div>
                            ) : (
                                temaProjects.map((p: any) => (
                                    <div key={p.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 shadow-sm relative">
                                        <span className="absolute top-4 right-4 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                            Sisa Kuota: {p.kuota - (p.mahasiswas?.length || 0)}/{p.kuota}
                                        </span>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 pr-24">{p.judul}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{p.deskripsi}</p>
                                        
                                        {/* Menampilkan Syarat Skill dengan visual Skala 1-5 */}
                                        {p.required_skills && p.required_skills.length > 0 && (
                                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Syarat Skill (Min. Level)</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {p.required_skills.filter((req:any) => req.level > 1).map((req: any, i: number) => (
                                                        <span key={i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-slate-700">
                                                            {req.name} 
                                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">Lvl {req.level}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2">*Hanya menampilkan skill dengan syarat di atas Dasar (Level 1)</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                            <span className="flex items-center gap-1"><Users size={14}/> Pengusul: {p.pengusul?.name}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {roleFlags.isMahasiswa && (
                            <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 h-max sticky top-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Keranjang Pilihan Anda</h3>
                                
                                {temaSelection?.status === 'Locked' || temaSelection?.status === 'Matched' ? (
                                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-bold border border-emerald-200 text-center">
                                        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50"/>
                                        Pilihan sudah dikunci! <br/>
                                        <span className="text-xs font-normal">Status: {temaSelection.status}</span>
                                    </div>
                                ) : (
                                    <form onSubmit={submitTema} className="space-y-4">
                                        {[1, 2, 3].map(num => (
                                            <div key={num}>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Pilihan Prioritas {num}</label>
                                                <select 
                                                    disabled={!isTemaBuka}
                                                    value={formTema.data[`pilihan_${num}_id` as keyof typeof formTema.data] as string} 
                                                    onChange={e => formTema.setData(`pilihan_${num}_id` as any, e.target.value)} 
                                                    className="w-full text-xs rounded border-slate-200"
                                                    required
                                                >
                                                    <option value="">-- Pilih Judul (ID) --</option>
                                                    {temaProjects.map((p: any) => <option key={p.id} value={p.id}>[{p.id}] {p.judul.substring(0, 40)}...</option>)}
                                                </select>
                                            </div>
                                        ))}
                                        <div className="pt-2">
                                            <p className="text-[10px] text-slate-500 mb-2 leading-tight">Sistem Matchmaking mensyaratkan Portofolio Skill Anda memenuhi target Minimum Level dari Dosen.</p>
                                            <button type="submit" disabled={!isTemaBuka || formTema.processing} className="w-full bg-blue-600 disabled:bg-slate-300 text-white font-bold py-2 rounded-lg text-sm">
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
                                    {roleFlags.isDosen && <option value="Tipe 2">Tipe 2 (Dilempar ke Katalog Matchmaking)</option>}
                                    {roleFlags.isMahasiswa && <option value="Mandiri">Mandiri (Judul Bawaan Mahasiswa)</option>}
                                </select>
                            </div>
                            
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Judul Tugas Akhir</label><input type="text" value={formPengajuan.data.judul} onChange={e => formPengajuan.setData('judul', e.target.value)} className="w-full text-sm rounded border-slate-200" required/></div>
                            <div><label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Singkat</label><textarea value={formPengajuan.data.deskripsi} onChange={e => formPengajuan.setData('deskripsi', e.target.value)} className="w-full text-sm rounded border-slate-200 h-24" required></textarea></div>

                            {formPengajuan.data.tipe === 'Tipe 2' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Kuota Mahasiswa (Maks. Mahasiswa di Tim ini)</label>
                                    <input type="number" min="1" max="10" value={formPengajuan.data.kuota} onChange={e => formPengajuan.setData('kuota', parseInt(e.target.value))} className="w-full text-sm rounded border-slate-200" required/>
                                </div>
                            )}

                            {formPengajuan.data.tipe === 'Tipe 1' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Mahasiswa (Bisa lebih dari 1 untuk Tim)</label>
                                    {formPengajuan.data.mahasiswa_ids.map((id, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <select value={id} onChange={e => {
                                                const newIds = [...formPengajuan.data.mahasiswa_ids];
                                                newIds[index] = e.target.value;
                                                formPengajuan.setData('mahasiswa_ids', newIds);
                                            }} className="flex-1 text-sm rounded border-slate-200" required>
                                                <option value="">-- Pilih Anggota Tim {index + 1} --</option>
                                                {mahasiswas.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                            {index > 0 && (
                                                <button type="button" onClick={() => {
                                                    const newIds = formPengajuan.data.mahasiswa_ids.filter((_, i) => i !== index);
                                                    formPengajuan.setData('mahasiswa_ids', newIds);
                                                }} className="px-3 bg-rose-100 text-rose-600 rounded">X</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => formPengajuan.setData('mahasiswa_ids', [...formPengajuan.data.mahasiswa_ids, ''])} className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1">+ Tambah Anggota Mahasiswa</button>
                                </div>
                            )}

                            {/* UI DINAMIS MANDATORY SKILL TIPE 2 */}
                            {formPengajuan.data.tipe === 'Tipe 2' && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-xs font-bold text-slate-700">Wajib Isi: Kebutuhan Skill & Target Level</label>
                                        <button type="button" onClick={handleTarikProfilDosen} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-emerald-200 transition-colors">
                                            <RefreshCw size={12}/> Samakan dengan Profil Saya
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {formPengajuan.data.required_skills.map((skill, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                                <span className="text-xs font-bold text-slate-700 ml-1 truncate" title={skill.name}>{skill.name}</span>
                                                <select 
                                                    value={skill.level}
                                                    onChange={e => {
                                                        const newSkills = [...formPengajuan.data.required_skills];
                                                        newSkills[index].level = parseInt(e.target.value);
                                                        formPengajuan.setData('required_skills', newSkills);
                                                    }}
                                                    className="w-36 text-xs rounded border-slate-200 bg-slate-50" required
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
                                    {competencies.length === 0 && (
                                        <p className="text-xs text-rose-500 mt-2">Data Master Kompetensi belum diatur oleh Admin.</p>
                                    )}
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
                                <button type="button" onClick={() => formPengajuan.setData('pembimbing_ids', [...formPengajuan.data.pembimbing_ids, ''])} className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1">+ Tambah Pembimbing Lain</button>
                            </div>

                            <button type="submit" disabled={formPengajuan.processing} className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg text-sm mt-4">Kirim Pengajuan</button>
                        </form>
                    </div>
                )}

                {/* KONTEN TAB: APPROVAL KAPRODI */}
                {activeTab === 'approval' && roleFlags.isPanitia && (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm mb-6">
                            Area ini khusus untuk <strong>Kaprodi / Panitia</strong> memverifikasi pengajuan judul Mandiri yang diajukan oleh Mahasiswa.
                        </div>

                        {pendingProjects.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">Tidak ada pengajuan mandiri yang menunggu approval.</div>
                        ) : (
                            pendingProjects.map((p: any) => (
                                <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">{p.judul}</h3>
                                        <p className="text-sm text-slate-600 mt-1">{p.deskripsi}</p>
                                        <p className="text-xs text-slate-500 mt-2">Diajukan oleh: <span className="font-bold">{p.pengusul?.name}</span> (Jalur Mandiri)</p>
                                    </div>
                                    <button onClick={() => approveMandiri(p.id)} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2 shadow">
                                        <ShieldCheck size={18}/> ACC (Setujui)
                                    </button>
                                </div>
                            ))
                        )}
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
                                    
                                    <div className="mt-2 text-sm text-slate-500">
                                        Dikerjakan oleh Tim ({p.mahasiswas?.length}/{p.kuota}): 
                                        <ul className="list-disc ml-5 mt-1">
                                            {p.mahasiswas?.length > 0 ? (
                                                p.mahasiswas.map((m: any) => <li key={m.id} className="font-bold text-slate-800 dark:text-zinc-200">{m.name}</li>)
                                            ) : (
                                                <li className="font-bold text-slate-800 dark:text-zinc-200">BELUM ADA TIM</li>
                                            )}
                                        </ul>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {p.pembimbings?.map((pb: any) => (
                                            <span key={pb.id} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">{pb.role}: {pb.dosen?.name}</span>
                                        ))}
                                    </div>
                                </div>

                                {roleFlags.isPanitia && p.status === 'Draft Plotting' && (
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg w-full md:w-64 shrink-0 h-max">
                                        <label className="block text-[10px] font-bold text-amber-800 mb-1 uppercase">Manual Tambah Tim (Override)</label>
                                        <select id={`override-${p.id}`} className="w-full text-xs rounded border-amber-300 bg-white mb-2">
                                            <option value="">-- Pilih Mahasiswa --</option>
                                            {mahasiswas.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <button onClick={() => {
                                            const sel = document.getElementById(`override-${p.id}`) as HTMLSelectElement;
                                            handleOverride(p.id, sel.value);
                                        }} className="w-full bg-amber-600 text-white text-xs font-bold py-1.5 rounded">Tambahkan ke Tim</button>
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