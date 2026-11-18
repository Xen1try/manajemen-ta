import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;

    return (
        <>
            <Head title="SIMTA - Sistem Informasi Manajemen Tugas Akhir" />

            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                {/* Header Navigation */}
                <header className="mb-6 w-full max-w-[335px] text-sm lg:max-w-4xl">
                    <nav className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo-polman.png"
                                alt="Polman Bandung"
                                className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                            />
                            <span className="hidden border-l border-slate-300 pl-3 text-xs font-medium text-slate-600 sm:inline dark:border-slate-700 dark:text-slate-400">
                                Teknik Otomasi Manufaktur & Mekatronika
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="inline-block rounded-md bg-[#0065b3] px-5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-[#005091]"
                                >
                                    Buka Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="inline-block rounded-md border border-transparent px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:text-slate-200 dark:hover:border-slate-700"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-block rounded-md border border-[#0065b3] px-4 py-1.5 text-sm font-medium text-[#0065b3] transition hover:bg-[#0065b3] hover:text-white dark:border-blue-400 dark:text-blue-400"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Main Split Card */}
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow">
                    <main className="flex w-full max-w-[335px] flex-col-reverse overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:max-w-4xl lg:flex-row dark:border-slate-800 dark:bg-[#161615]">
                        {/* Panel Kiri: Informasi & CTA */}
                        <div className="flex-1 p-6 pb-10 text-[13px] leading-[20px] lg:p-12">
                            <span className="mb-3 inline-block rounded-full bg-[#e0f0ff] px-3 py-1 text-xs font-semibold text-[#0065b3] dark:bg-blue-950 dark:text-blue-300">
                                Portal Akademik Tugas Akhir
                            </span>
                            <h1 className="mb-2 text-xl font-bold tracking-tight text-slate-900 lg:text-2xl dark:text-white">
                                SIMTA Polman Bandung
                            </h1>
                            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                                Platform terintegrasi untuk pengelolaan judul, matchmaking pembimbing, logbook bimbingan, hingga penjadwalan sidang Tugas Akhir.
                            </p>

                            {/* Alur Tahapan */}
                            <ul className="mb-7 flex flex-col space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0065b3] text-[11px] font-bold text-white">
                                        1
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                        <strong>Pemilihan Topik & Matchmaking:</strong> Ajukan judul mandiri atau pilih proyek payung dosen.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0065b3] text-[11px] font-bold text-white">
                                        2
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                        <strong>Bimbingan & Validasi Syarat:</strong> Pantau logbook dan kelayakan sidang secara otomatis.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0065b3] text-[11px] font-bold text-white">
                                        3
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                        <strong>Sempro & Sidang TA:</strong> Jadwal terpusat anti-bentrok serta berita acara digital.
                                    </span>
                                </li>
                            </ul>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={auth.user ? '/dashboard' : '/login'}
                                    className="inline-flex items-center justify-center rounded-md bg-[#0065b3] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#005091]"
                                >
                                    {auth.user ? 'Masuk ke Workspace' : 'Mulai Sekarang'}
                                </Link>
                            </div>
                        </div>

                        {/* Panel Kanan: Visual & Aturan Akademik */}
                        <div className="relative flex w-full shrink-0 flex-col justify-between bg-gradient-to-br from-[#0065b3] via-[#004c87] to-[#00335c] p-8 text-white lg:w-[400px] lg:p-10">
                            <div>
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 backdrop-blur-xs">
                                        <img
                                            src="/images/logo-polman-icon.png"
                                            alt="Ikon Polman"
                                            className="h-7 w-auto object-contain brightness-0 invert"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium tracking-wider text-blue-200 uppercase">
                                            Politeknik Manufaktur Bandung
                                        </p>
                                        <p className="text-sm font-semibold">
                                            Jurusan Teknik Otomasi Manufaktur & Mekatronika
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-blue-200 uppercase">
                                        Prasyarat Kelayakan Sidang
                                    </p>
                                    <ul className="space-y-2 text-xs text-blue-50">
                                        <li className="flex justify-between border-b border-white/10 pb-1.5">
                                            <span>Batas Plagiarisme (iThenticate)</span>
                                            <span className="font-bold text-white">Maks. 25%</span>
                                        </li>
                                        <li className="flex justify-between border-b border-white/10 pb-1.5">
                                            <span>Logbook Bimbingan</span>
                                            <span className="font-bold text-white">Min. 8x / Dosen</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Presensi Seminar Mahasiswa</span>
                                            <span className="font-bold text-white">Min. 5x Hadir</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <p className="mt-8 text-[11px] text-blue-200/80">
                                © {new Date().getFullYear()} SIMTA AE — Polman Bandung.
                            </p>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}