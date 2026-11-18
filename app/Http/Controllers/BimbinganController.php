<?php

namespace App\Http\Controllers;

use App\Models\Bimbingan;
use App\Models\TaProject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BimbinganController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isDosen = $user->dosenProfile()->exists()
            || $user->roles()->where('name', 'like', '%dosen%')->exists();

        // 1. TAMPILAN DOSEN PEMBIMBING
        if ($isDosen) {
            $bimbingans = Bimbingan::with([
                'user:id,name,email',
                'taProject:id,judul,tipe',
            ])
                ->where(function ($query) use ($user) {
                    $query->where('lecturer_id', $user->id)
                        ->orWhere('lecturer_name', $user->name);
                })
                ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
                ->latest('date')
                ->get();

            $students = $bimbingans
                ->pluck('user')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn ($mhs) => [
                    'id' => $mhs->id,
                    'name' => $mhs->name,
                ]);

            return Inertia::render('bimbingan', [
                'isDosen' => true,
                'bimbingans' => $bimbingans,
                'projects' => [],
                'students' => $students,
                'progressSummary' => null,
            ]);
        }

        // 2. TAMPILAN MAHASISWA
        $taProjects = TaProject::with(['pembimbings'])
            ->whereHas('mahasiswas', fn ($q) => $q->where('users.id', $user->id))
            ->latest()
            ->get();

        $formattedProjects = $taProjects->map(function ($project) {
            $supervisors = [];

            foreach ($project->pembimbings as $index => $pembimbing) {
                $dosenId = $pembimbing->dosen_id
                    ?? $pembimbing->user_id
                    ?? $pembimbing->pembimbing_id
                    ?? $pembimbing->lecturer_id
                    ?? null;

                $dosen = $dosenId ? User::find($dosenId) : null;

                if ($dosen) {
                    $supervisors[] = [
                        'id' => $dosen->id,
                        'name' => $dosen->name,
                        'pembimbing_ke' => $pembimbing->urutan ?? $pembimbing->pembimbing_ke ?? ($index + 1),
                    ];
                }
            }

            return [
                'id' => $project->id,
                'judul' => $project->judul,
                'tipe' => $project->tipe,
                'status' => $project->status,
                'supervisors' => $supervisors,
            ];
        })->values();

        $activeProject = $formattedProjects->first();

        $bimbingans = Bimbingan::with([
            'lecturer:id,name',
            'taProject:id,judul,tipe',
        ])
            ->where('user_id', $user->id)
            ->latest('date')
            ->get();

        $progressSummary = collect($activeProject['supervisors'] ?? [])->map(function ($sup) use ($bimbingans, $activeProject) {
            $query = $bimbingans->where('lecturer_id', $sup['id']);

            if ($activeProject) {
                $query = $query->where('ta_project_id', $activeProject['id']);
            }

            $approvedCount = $query->where('status', 'approved')->count();
            $pendingCount = $query->where('status', 'pending')->count();

            return [
                'lecturer_id' => $sup['id'],
                'lecturer_name' => $sup['name'],
                'pembimbing_ke' => $sup['pembimbing_ke'],
                'approved' => $approvedCount,
                'pending' => $pendingCount,
                'target' => 8,
                'is_eligible' => $approvedCount >= 8,
            ];
        })->values();

        return Inertia::render('bimbingan', [
            'isDosen' => false,
            'bimbingans' => $bimbingans,
            'projects' => $formattedProjects,
            'students' => [],
            'progressSummary' => $progressSummary,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'ta_project_id' => 'nullable|exists:ta_projects,id',
            'date' => 'required|date',
            'lecturer_id' => 'nullable|exists:users,id',
            'lecturer_name' => 'required_without:lecturer_id|nullable|string|max:255',
            'pembimbing_ke' => 'nullable|integer|in:1,2',
            'topic' => 'required|string|max:255',
            'notes' => 'required|string',
            'next_action' => 'required|string|max:255',
        ]);

        $lecturer = !empty($validated['lecturer_id'])
            ? User::find($validated['lecturer_id'])
            : (!empty($validated['lecturer_name']) ? User::where('name', $validated['lecturer_name'])->first() : null);

        $projectId = $validated['ta_project_id']
            ?? TaProject::whereHas('mahasiswas', fn ($q) => $q->where('users.id', $user->id))
                ->latest()
                ->value('id');

        Bimbingan::create([
            'team_id' => $user->current_team_id,
            'ta_project_id' => $projectId,
            'user_id' => $user->id,
            'lecturer_id' => $lecturer?->id,
            'lecturer_name' => $lecturer ? $lecturer->name : $validated['lecturer_name'],
            'pembimbing_ke' => $validated['pembimbing_ke'] ?? 1,
            'date' => $validated['date'],
            'topic' => $validated['topic'],
            'notes' => $validated['notes'],
            'next_action' => $validated['next_action'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Logbook bimbingan berhasil dikirim dan menunggu verifikasi dosen.');
    }

    public function update(Request $request, string $currentTeam, Bimbingan $bimbingan)
    {
        $user = $request->user();

        abort_unless((int) $bimbingan->user_id === (int) $user->id, 403, 'Anda tidak berhak mengubah catatan bimbingan ini.');
        abort_if($bimbingan->status === 'approved', 422, 'Catatan bimbingan yang sudah disetujui tidak dapat diubah.');

        $validated = $request->validate([
            'ta_project_id' => 'nullable|exists:ta_projects,id',
            'date' => 'required|date',
            'lecturer_id' => 'nullable|exists:users,id',
            'lecturer_name' => 'required_without:lecturer_id|nullable|string|max:255',
            'pembimbing_ke' => 'nullable|integer|in:1,2',
            'topic' => 'required|string|max:255',
            'notes' => 'required|string',
            'next_action' => 'required|string|max:255',
        ]);

        $lecturer = !empty($validated['lecturer_id'])
            ? User::find($validated['lecturer_id'])
            : (!empty($validated['lecturer_name']) ? User::where('name', $validated['lecturer_name'])->first() : null);

        $bimbingan->update([
            'ta_project_id' => $validated['ta_project_id'] ?? $bimbingan->ta_project_id,
            'lecturer_id' => $lecturer?->id,
            'lecturer_name' => $lecturer ? $lecturer->name : $validated['lecturer_name'],
            'pembimbing_ke' => $validated['pembimbing_ke'] ?? $bimbingan->pembimbing_ke,
            'date' => $validated['date'],
            'topic' => $validated['topic'],
            'notes' => $validated['notes'],
            'next_action' => $validated['next_action'],
            'status' => 'pending', // Reset ke pending jika sebelumnya rejected/revisi
        ]);

        return redirect()->back()->with('success', 'Catatan bimbingan berhasil diperbarui.');
    }

    public function destroy(Request $request, string $currentTeam, Bimbingan $bimbingan)
    {
        $user = $request->user();

        abort_unless((int) $bimbingan->user_id === (int) $user->id, 403, 'Anda tidak berhak menghapus catatan bimbingan ini.');
        abort_if($bimbingan->status === 'approved', 422, 'Catatan bimbingan yang sudah disetujui tidak dapat dihapus.');

        $bimbingan->delete();

        return redirect()->back()->with('success', 'Catatan bimbingan berhasil dihapus.');
    }

    public function verify(Request $request, string $currentTeam, Bimbingan $bimbingan)
    {
        $user = $request->user();

        abort_unless(
            (int) $bimbingan->lecturer_id === (int) $user->id || $bimbingan->lecturer_name === $user->name,
            403,
            'Anda tidak berhak memverifikasi bimbingan ini.'
        );

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'lecturer_feedback' => 'nullable|string|max:1000',
        ]);

        $bimbingan->update([
            'lecturer_id' => $user->id,
            'status' => $validated['status'],
            'lecturer_feedback' => $validated['lecturer_feedback'] ?? null,
            'verified_at' => now(),
        ]);

        $msg = $validated['status'] === 'approved'
            ? 'Logbook bimbingan berhasil disetujui.'
            : 'Logbook dikembalikan untuk revisi.';

        return redirect()->back()->with('success', $msg);
    }
}