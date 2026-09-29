import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { UserCog, GraduationCap, Save, Network } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'Profil Akademik', href: '/settings/profil-akademik' },
];

export default function AcademicProfile({ prodis, competencies, jabatans, userRoles, dosenProfile, mahasiswaProfile }: any) {
    const isDosen = userRoles.includes('Dosen Pembimbing') || userRoles.includes('Penguji');
    const isMahasiswa = userRoles.includes('Mahasiswa');

    // Fungsi untuk memetakan seluruh Master Kompetensi ke dalam form (Wajib diisi semua)
    const buildInitialSkills = (savedSkills: any[]) => {
        // Buat map dari data yang sudah tersimpan di database
        const savedMap = new Map((savedSkills || []).map(s => [s.name, s.level]));
        
        // Return seluruh list dari master data kompetensi
        // Jika belum pernah diatur, default ke Level 1
        return competencies.map((c: any) => ({
            name: c.name,
            level: savedMap.has(c.name) ? savedMap.get(c.name) : 1 
        }));
    };

    const initialDosenSkills = Array.isArray(dosenProfile.skill_vector) ? dosenProfile.skill_vector : [];
    const initialMhsSkills = Array.isArray(mahasiswaProfile.skill_vector) ? mahasiswaProfile.skill_vector : [];

    const formDosen = useForm({
        nip: dosenProfile.nip || '',
        prodi_id: dosenProfile.prodi_id || '',
        jabatan_fungsional_id: dosenProfile.jabatan_fungsional_id || '',
        skill_vector: buildInitialSkills(initialDosenSkills) as {name: string, level: number}[], 
    });

    const formMhs = useForm({
        nim: mahasiswaProfile.nim || '',
        prodi_id: mahasiswaProfile.prodi_id || '',
        angkatan: mahasiswaProfile.angkatan || new Date().getFullYear(),
        skill_vector: buildInitialSkills(initialMhsSkills) as {name: string, level: number}[], 
        academic_status: mahasiswaProfile.academic_status || 'drafting',
    });

    const submitDosen = (e: React.FormEvent) => {
        e.preventDefault();
        formDosen.post('/settings/profil-akademik/dosen', { preserveScroll: true });
    };

    const submitMhs = (e: React.FormEvent) => {
        e.preventDefault();
        formMhs.post('/settings/profil-akademik/mahasiswa', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Profil Akademik" />
            <div className="space-y-8 w-full max-w-2xl">
                
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Profil Akademik</h2>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Lengkapi parameter portofolio skill Anda secara utuh untuk keperluan Algoritma Matchmaking.</p>
                </div>

                {/* FORM MAHASISWA */}
                {isMahasiswa && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><GraduationCap size={20} /></div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Portofolio Mahasiswa</h3>
                                <p className="text-xs text-slate-500">Status kesiapan dan daftar lengkap parameter keahlian.</p>
                            </div>
                        </div>
                        <form onSubmit={submitMhs} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">NIM</label><input type="text" value={formMhs.data.nim} onChange={e => formMhs.setData('nim', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" required /></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Angkatan</label><input type="number" value={formMhs.data.angkatan} onChange={e => formMhs.setData('angkatan', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" required /></div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Program Studi</label>
                                    <select value={formMhs.data.prodi_id} onChange={e => formMhs.setData('prodi_id', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" required>
                                        <option value="">-- Pilih Prodi --</option>
                                        {prodis.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Status Kesiapan</label>
                                    <select value={formMhs.data.academic_status} onChange={e => formMhs.setData('academic_status', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" required>
                                        <option value="drafting">Penyusunan Judul</option>
                                        <option value="ready_sempro">Siap Seminar Proposal</option>
                                        <option value="ready_semhas">Siap Seminar Hasil</option>
                                        <option value="ready_sidang">Siap Sidang Akhir</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Skill Vector Mandatory Mahasiswa */}
                            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold flex items-center gap-2 mb-4"><Network size={14} className="text-blue-500"/> Wajib Isi: Parameter Portofolio (Skala 1-5)</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formMhs.data.skill_vector.map((skill, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 ml-1">{skill.name}</span>
                                            <select 
                                                value={skill.level}
                                                onChange={e => {
                                                    const newSkills = [...formMhs.data.skill_vector];
                                                    newSkills[index].level = parseInt(e.target.value);
                                                    formMhs.setData('skill_vector', newSkills);
                                                }}
                                                className="w-36 text-xs rounded border-slate-200 bg-slate-50 dark:bg-zinc-950" required
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

                            <div className="flex justify-end">
                                <button type="submit" disabled={formMhs.processing} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                    <Save size={16} /> {formMhs.processing ? 'Menyimpan...' : 'Simpan Profil Mahasiswa'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* FORM DOSEN */}
                {isDosen && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg"><UserCog size={20} /></div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Atribut Dosen</h3>
                                <p className="text-xs text-slate-500">Kapasitas bimbingan dan area keahlian.</p>
                            </div>
                        </div>
                        <form onSubmit={submitDosen} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">NIP / NIDN</label><input type="text" value={formDosen.data.nip} onChange={e => formDosen.setData('nip', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" /></div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Jabatan Fungsional</label>
                                    <select value={formDosen.data.jabatan_fungsional_id} onChange={e => formDosen.setData('jabatan_fungsional_id', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" required>
                                        <option value="">-- Pilih Jabatan --</option>
                                        {jabatans.map((j: any) => (
                                            <option key={j.id} value={j.id}>{j.name} (Kuota: {j.max_kuota_bimbingan} Mhs)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Program Studi Dominan</label>
                                    <select value={formDosen.data.prodi_id} onChange={e => formDosen.setData('prodi_id', e.target.value)} className="w-full text-sm rounded-lg border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100" required>
                                        <option value="">-- Pilih Prodi --</option>
                                        {prodis.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Skill Vector Mandatory Dosen */}
                            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold flex items-center gap-2 mb-4"><Network size={14} className="text-emerald-500"/> Wajib Isi: Area Keahlian Dosen (Skala 1-5)</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formDosen.data.skill_vector.map((skill, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 ml-1">{skill.name}</span>
                                            <select 
                                                value={skill.level}
                                                onChange={e => {
                                                    const newSkills = [...formDosen.data.skill_vector];
                                                    newSkills[index].level = parseInt(e.target.value);
                                                    formDosen.setData('skill_vector', newSkills);
                                                }}
                                                className="w-36 text-xs rounded border-slate-200 bg-slate-50 dark:bg-zinc-950" required
                                            >
                                                <option value={1}>Lvl 1 (Dasar)</option>
                                                <option value={2}>Lvl 2 (Praktisi)</option>
                                                <option value={3}>Lvl 3 (Menengah)</option>
                                                <option value={4}>Lvl 4 (Mahir)</option>
                                                <option value={5}>Lvl 5 (Ahli / Expert)</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                {competencies.length === 0 && (
                                    <p className="text-xs text-rose-500 mt-2">Data Master Kompetensi belum diatur oleh Admin.</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button type="submit" disabled={formDosen.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                    <Save size={16} /> {formDosen.processing ? 'Menyimpan...' : 'Simpan Profil Dosen'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}

AcademicProfile.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>
        <SettingsLayout>{page}</SettingsLayout>
    </AppLayout>
);