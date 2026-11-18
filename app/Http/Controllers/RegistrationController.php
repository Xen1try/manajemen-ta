<?php

namespace App\Http\Controllers;

use App\Models\Bimbingan;
use App\Models\MilestoneRegistration;
use App\Models\SeminarAttendance;
use App\Models\TaDocument;
use App\Models\TaProject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    private function isApprover($user): bool
    {
        return $user->hasPermission('master.manage')
            || $user->hasPermission('sidang.create')
            || $user->dosenProfile()->exists()
            || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Kaprodi', 'Dosen Pembimbing'])->exists();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isApprover = $this->isApprover($user);

        // 1. TAMPILAN DOSEN PEMBIMBING / PANITIA TA (Antrean ACC Pendaftaran Ujian)
        if ($isApprover) {
            $query = MilestoneRegistration::with(['mahasiswa:id,name,email'])
                ->orderByRaw("CASE WHEN status = 'pending_pembimbing' THEN 0 ELSE 1 END")
                ->latest();

            $isAdminOrPanitia = $user->hasPermission('master.manage')
                || $user->hasPermission('sidang.create')
                || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Kaprodi'])->exists();

            // Jika murni Dosen Pembimbing, filter mahasiswa bimbingannya
            if (! $isAdminOrPanitia) {
                $menteeIds = TaProject::whereHas('pembimbings', fn ($q) => $q->where('dosen_id', $user->id))
                    ->with('mahasiswas:id')
                    ->get()
                    ->pluck('mahasiswas')
                    ->flatten()
                    ->pluck('id')
                    ->unique();

                if ($menteeIds->isNotEmpty()) {
                    $query->whereIn('mahasiswa_id', $menteeIds);
                }
            }

            $allRegistrations = $query->get()->map(function ($reg) {
                $bimbingan1 = Bimbingan::where('user_id', $reg->mahasiswa_id)
                    ->where('pembimbing_ke', 1)
                    ->where('status', 'approved')
                    ->count();
                $bimbingan2 = Bimbingan::where('user_id', $reg->mahasiswa_id)
                    ->where('pembimbing_ke', 2)
                    ->where('status', 'approved')
                    ->count();
                $seminarCount = SeminarAttendance::where('user_id', $reg->mahasiswa_id)
                    ->where('status', 'approved')
                    ->count();
                $ithenticate = TaDocument::where('user_id', $reg->mahasiswa_id)
                    ->where('category', 'ithenticate')
                    ->first();

                $reg->verification_summary = [
                    'bimbingan_1' => $bimbingan1,
                    'bimbingan_2' => $bimbingan2,
                    'seminar_count' => $seminarCount,
                    'ithenticate_score' => $ithenticate?->similarity_score,
                ];

                return $reg;
            });

            return Inertia::render('pendaftaran', [
                'isApprover' => true,
                'registrations' => [],
                'pendingList' => $allRegistrations,
                'stats' => null,
            ]);
        }

        // 2. TAMPILAN MAHASISWA (Evaluasi Prasyarat Otomatis dari Database)
        $registrations = MilestoneRegistration::where('mahasiswa_id', $user->id)
            ->get()
            ->keyBy('milestone_type');

        $project = TaProject::with('pembimbings')
            ->whereHas('mahasiswas', fn ($q) => $q->where('users.id', $user->id))
            ->latest()
            ->first();

        $hasPembimbing2 = $project
            ? $project->pembimbings->where('urutan', 2)->isNotEmpty()
            : true;

        // Hitung logbook bimbingan tervalidasi secara riil
        $bimbinganUtama = Bimbingan::where('user_id', $user->id)
            ->where('pembimbing_ke', 1)
            ->where('status', 'approved')
            ->count();

        $bimbinganPendamping = Bimbingan::where('user_id', $user->id)
            ->where('pembimbing_ke', 2)
            ->where('status', 'approved')
            ->count();

        // Hitung kehadiran seminar tervalidasi secara riil
        $seminarApprovedCount = SeminarAttendance::where('user_id', $user->id)
            ->where('status', 'approved')
            ->count();

        // Tarik status dokumen & skor iThenticate dari arsip dokumen
        $docs = TaDocument::where('user_id', $user->id)->get()->keyBy('category');
        $ithenticateDoc = $docs->get('ithenticate');

        return Inertia::render('pendaftaran', [
            'isApprover' => false,
            'registrations' => $registrations,
            'pendingList' => [],
            'stats' => [
                'has_project' => $project !== null && $project->status !== 'Draft',
                'has_pembimbing_2' => $hasPembimbing2,
                'bimbingan_utama' => $bimbinganUtama,
                'bimbingan_pendamping' => $bimbinganPendamping,
                'kehadiran_seminar' => $seminarApprovedCount,
                'ithenticate_score' => $ithenticateDoc?->similarity_score,
                'ithenticate_approved' => $ithenticateDoc?->status === 'approved',
                'docs_status' => [
                    'proposal' => $docs->get('proposal')?->status,
                    'proposal_url' => $docs->get('proposal')?->file_url,
                    'laporan_semhas' => $docs->get('laporan_semhas')?->status,
                    'laporan_semhas_url' => $docs->get('laporan_semhas')?->file_url,
                    'laporan_akhir' => $docs->get('laporan_akhir')?->status,
                    'laporan_akhir_url' => $docs->get('laporan_akhir')?->file_url,
                    'produk_url' => $docs->get('produk')?->file_url,
                    'orisinalitas' => $docs->get('orisinalitas')?->status,
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'milestone_type' => 'required|in:Sempro,Semhas,Sidang',
            'dokumen_kti_link' => 'required|string|max:500',
            'dokumen_produk_link' => 'required|string|max:500',
            'bukti_pembayaran_link' => 'nullable|string|max:500',
        ]);

        $type = $validated['milestone_type'];

        // Validasi prasyarat server-side agar tidak bisa di-bypass
        $bimbingan1 = Bimbingan::where('user_id', $user->id)
            ->where('pembimbing_ke', 1)
            ->where('status', 'approved')
            ->count();

        $minBimbingan = $type === 'Sidang' ? 8 : 6;
        if ($bimbingan1 < $minBimbingan) {
            return back()->withErrors([
                'milestone_type' => "Jumlah bimbingan tervalidasi Pembimbing 1 belum memenuhi syarat minimal ({$bimbingan1}/{$minBimbingan} sesi).",
            ]);
        }

        $seminarCount = SeminarAttendance::where('user_id', $user->id)
            ->where('status', 'approved')
            ->count();

        if ($type === 'Sidang') {
            if ($seminarCount < 5) {
                return back()->withErrors([
                    'milestone_type' => "Kehadiran seminar terverifikasi belum memenuhi syarat minimal ({$seminarCount}/5 kali).",
                ]);
            }

            $ithenticate = TaDocument::where('user_id', $user->id)
                ->where('category', 'ithenticate')
                ->first();

            if (! $ithenticate || $ithenticate->similarity_score === null || $ithenticate->similarity_score > 25) {
                return back()->withErrors([
                    'milestone_type' => 'Sertifikat iThenticate dengan skor ≤ 25% wajib diunggah di menu Dokumen TA sebelum mendaftar Sidang.',
                ]);
            }

            if (empty($validated['bukti_pembayaran_link'])) {
                return back()->withErrors([
                    'bukti_pembayaran_link' => 'Bukti lunas pembayaran semester wajib dilampirkan untuk Sidang.',
                ]);
            }
        }

        MilestoneRegistration::updateOrCreate(
            [
                'mahasiswa_id' => $user->id,
                'milestone_type' => $type,
            ],
            [
                'dokumen_kti_link' => $validated['dokumen_kti_link'],
                'dokumen_produk_link' => $validated['dokumen_produk_link'],
                'bukti_pembayaran_link' => $validated['bukti_pembayaran_link'] ?? null,
                'jumlah_kehadiran_seminar' => $seminarCount,
                'status' => 'pending_pembimbing',
                'catatan_penolakan' => null,
            ]
        );

        return redirect()->back()->with('success', "Pendaftaran {$type} berhasil diajukan dan menunggu ACC Pembimbing.");
    }

    /**
     * ACC atau Tolak Pendaftaran Ujian oleh Dosen Pembimbing / Panitia TA
     */
    public function verify(Request $request, string $currentTeam, MilestoneRegistration $registration)
    {
        $user = $request->user();
        abort_unless($this->isApprover($user), 403, 'Anda tidak memiliki hak menyetujui pendaftaran ujian.');

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'catatan_penolakan' => 'required_if:status,rejected|nullable|string|max:1000',
        ], [
            'catatan_penolakan.required_if' => 'Alasan penolakan wajib diisi agar mahasiswa dapat memperbaikinya.',
        ]);

        $registration->update([
            'status' => $validated['status'],
            'catatan_penolakan' => $validated['status'] === 'rejected' ? $validated['catatan_penolakan'] : null,
        ]);

        $msg = $validated['status'] === 'approved'
            ? "Pendaftaran {$registration->milestone_type} mahasiswa disetujui & siap dijadwalkan."
            : "Pendaftaran {$registration->milestone_type} dikembalikan untuk perbaikan.";

        return redirect()->back()->with('success', $msg);
    }
}