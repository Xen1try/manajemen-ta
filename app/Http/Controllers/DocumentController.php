<?php

namespace App\Http\Controllers;

use App\Models\TaDocument;
use App\Models\TaProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    private array $checklistTemplate = [
        [
            'category' => 'proposal',
            'label' => 'Proposal Tugas Akhir',
            'milestone' => 'Sempro',
            'accept' => '.pdf,.doc,.docx',
            'description' => 'Naskah proposal lengkap Bab 1–3 yang telah disetujui pembimbing.',
        ],
        [
            'category' => 'laporan_semhas',
            'label' => 'Laporan Kemajuan (Bab 1–3)',
            'milestone' => 'Semhas',
            'accept' => '.pdf,.doc,.docx',
            'description' => 'Draft laporan penelitian/perancangan untuk Seminar Hasil.',
        ],
        [
            'category' => 'laporan_akhir',
            'label' => 'Laporan Akhir Tugas Akhir',
            'milestone' => 'Sidang',
            'accept' => '.pdf,.doc,.docx',
            'description' => 'Naskah lengkap Bab 1–5 beserta lampiran siap Sidang Akhir.',
        ],
        [
            'category' => 'ithenticate',
            'label' => 'Hasil Cek Plagiarisme (iThenticate)',
            'milestone' => 'Sidang',
            'accept' => '.pdf',
            'description' => 'Sertifikat/laporan PDF resmi iThenticate dengan skor similarity maksimal 25%.',
        ],
        [
            'category' => 'orisinalitas',
            'label' => 'Surat Pernyataan Orisinalitas',
            'milestone' => 'Sidang',
            'accept' => '.pdf',
            'description' => 'Surat pernyataan keaslian karya bermeterai dan bertanda tangan.',
        ],
        [
            'category' => 'produk',
            'label' => 'Dokumentasi / Manual Produk TA',
            'milestone' => 'Sidang',
            'accept' => '.pdf,.zip,.rar',
            'description' => 'Manual book alat/perangkat lunak, poster, atau arsip kode sumber.',
        ],
    ];

    private function isReviewer($user): bool
    {
        return $user->hasPermission('master.manage')
            || $user->hasPermission('sidang.create')
            || $user->dosenProfile()->exists()
            || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Kaprodi', 'Dosen Pembimbing', 'Penguji'])->exists();
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        return number_format(max(1, $bytes / 1024), 0) . ' KB';
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isReviewer = $this->isReviewer($user);

        // 1. TAMPILAN DOSEN / PANITIA / ADMIN
        if ($isReviewer) {
            $query = TaDocument::with(['user:id,name,email', 'reviewer:id,name'])
                ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
                ->latest();

            // Jika murni Dosen Pembimbing (bukan Admin/Panitia), utamakan mahasiswa bimbingannya
            $isAdminOrPanitia = $user->hasPermission('master.manage')
                || $user->hasPermission('sidang.create')
                || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Kaprodi'])->exists();

            if (! $isAdminOrPanitia) {
                $menteeIds = TaProject::whereHas('pembimbings', fn ($q) => $q->where('dosen_id', $user->id))
                    ->with('mahasiswas:id')
                    ->get()
                    ->pluck('mahasiswas')
                    ->flatten()
                    ->pluck('id')
                    ->unique();

                if ($menteeIds->isNotEmpty()) {
                    $query->whereIn('user_id', $menteeIds);
                }
            }

            $documents = $query->get();

            $students = $documents
                ->pluck('user')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn ($mhs) => ['id' => $mhs->id, 'name' => $mhs->name]);

            return Inertia::render('dokumen', [
                'isReviewer' => true,
                'checklist' => [],
                'documents' => $documents,
                'students' => $students,
                'summary' => null,
            ]);
        }

        // 2. TAMPILAN MAHASISWA
        $documents = TaDocument::with(['reviewer:id,name'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $docsByCategory = $documents->keyBy('category');

        $checklist = collect($this->checklistTemplate)->map(function ($item) use ($docsByCategory) {
            return [
                ...$item,
                'document' => $docsByCategory->get($item['category']),
            ];
        })->values();

        $totalRequired = count($this->checklistTemplate);
        $approvedCount = $checklist->filter(fn ($c) => $c['document']?->status === 'approved')->count();
        $rejectedCount = $checklist->filter(fn ($c) => $c['document']?->status === 'rejected')->count();
        $uploadedCount = $checklist->filter(fn ($c) => $c['document'] !== null)->count();

        $ithenticateDoc = $docsByCategory->get('ithenticate');

        return Inertia::render('dokumen', [
            'isReviewer' => false,
            'checklist' => $checklist,
            'documents' => $documents,
            'students' => [],
            'summary' => [
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
                'uploaded' => $uploadedCount,
                'total' => $totalRequired,
                'percentage' => (int) round(($approvedCount / $totalRequired) * 100),
                'ithenticate_score' => $ithenticateDoc?->similarity_score,
                'ithenticate_passed' => $ithenticateDoc && $ithenticateDoc->similarity_score !== null
                    ? $ithenticateDoc->similarity_score <= 25
                    : null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validCategories = collect($this->checklistTemplate)->pluck('category')->implode(',');

        $validated = $request->validate([
            'category' => "required|in:{$validCategories}",
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:20480', // Maks 20 MB
            'similarity_score' => 'required_if:category,ithenticate|nullable|numeric|min:0|max:100',
        ], [
            'similarity_score.required_if' => 'Persentase skor kemiripan iThenticate wajib diisi.',
            'file.max' => 'Ukuran file maksimal 20 MB.',
        ]);

        $existing = TaDocument::where('user_id', $user->id)
            ->where('category', $validated['category'])
            ->first();

        abort_if($existing && $existing->status === 'approved', 422, 'Dokumen yang sudah disetujui tidak perlu diunggah ulang.');

        $uploadedFile = $request->file('file');
        $path = $uploadedFile->store("ta-documents/{$user->id}", 'public');
        $sizeLabel = $this->formatBytes($uploadedFile->getSize());

        if ($existing) {
            if ($existing->file_path && Storage::disk('public')->exists($existing->file_path)) {
                Storage::disk('public')->delete($existing->file_path);
            }

            $existing->update([
                'title' => $validated['title'],
                'file_path' => $path,
                'file_name' => $uploadedFile->getClientOriginalName(),
                'file_size' => $sizeLabel,
                'similarity_score' => $validated['category'] === 'ithenticate' ? $validated['similarity_score'] : null,
                'version' => $existing->version + 1,
                'status' => 'pending',
                'reviewer_notes' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);
        } else {
            TaDocument::create([
                'team_id' => $user->current_team_id,
                'user_id' => $user->id,
                'category' => $validated['category'],
                'title' => $validated['title'],
                'file_path' => $path,
                'file_name' => $uploadedFile->getClientOriginalName(),
                'file_size' => $sizeLabel,
                'similarity_score' => $validated['category'] === 'ithenticate' ? $validated['similarity_score'] : null,
                'version' => 1,
                'status' => 'pending',
            ]);
        }

        return redirect()->back()->with('success', 'Dokumen berhasil diunggah dan menunggu pemeriksaan.');
    }

    public function destroy(Request $request, string $currentTeam, TaDocument $document)
    {
        $user = $request->user();

        abort_unless((int) $document->user_id === (int) $user->id, 403, 'Anda tidak berhak menghapus dokumen ini.');
        abort_if($document->status === 'approved', 422, 'Dokumen yang sudah disetujui tidak dapat dihapus.');

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return redirect()->back()->with('success', 'Dokumen berhasil dihapus.');
    }

    public function verify(Request $request, string $currentTeam, TaDocument $document)
    {
        $user = $request->user();

        abort_unless($this->isReviewer($user), 403, 'Anda tidak memiliki hak validasi dokumen.');

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'reviewer_notes' => 'nullable|string|max:1000',
        ]);

        $document->update([
            'status' => $validated['status'],
            'reviewed_by' => $user->id,
            'reviewer_notes' => $validated['reviewer_notes'] ?? null,
            'reviewed_at' => now(),
        ]);

        $msg = $validated['status'] === 'approved'
            ? 'Dokumen mahasiswa berhasil disetujui.'
            : 'Dokumen dikembalikan untuk revisi.';

        return redirect()->back()->with('success', $msg);
    }
}