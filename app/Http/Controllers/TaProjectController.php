<?php

namespace App\Http\Controllers;

use App\Models\TaProject;
use App\Models\ProjectPembimbing;
use App\Models\AcademicYear;
use App\Models\Competency;
use Illuminate\Http\Request;

class TaProjectController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $user = clone $request->user();
        $user->load(['dosenProfile']);

        // Panggil fungsi terpusat dari Controller.php
        $flags = $this->getUserRoleFlags($user);

        $projects = TaProject::with(['pengusul', 'mahasiswas', 'pembimbings.dosen'])
            ->where('academic_year_id', $activeYear?->id)
            ->latest()->get();

        $temaSelection = null;
        if ($flags->isMahasiswa) {
            $temaSelection = \App\Models\TemaSelection::where('academic_year_id', $activeYear?->id)
                ->where('mahasiswa_id', $user->id)->first();
        }

        $dosens = \App\Models\User::whereHas('roles', fn($q) => $q->whereIn('name', ['Dosen Pembimbing', 'Penguji']))->get(['id', 'name']);
        $mahasiswas = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'Mahasiswa'))->get(['id', 'name']);
        
        return \Inertia\Inertia::render('tema-matchmaking', [
            'projects' => $projects,
            'temaSelection' => $temaSelection,
            'dosens' => $dosens,
            'mahasiswas' => $mahasiswas,
            'competencies' => Competency::orderBy('name', 'asc')->get(),
            'dosenProfile' => $flags->isDosen ? $user->dosenProfile : null, 
            'roleFlags' => [
                'isMahasiswa' => $flags->isMahasiswa,
                'isPanitia' => $flags->isPanitia,
                'isDosen' => $flags->isDosen,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $this->enforceTimelinePhase('pembagian_tema'); 

        $validated = $request->validate([
            'tipe' => 'required|in:Tipe 1,Tipe 2,Mandiri',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'required_skills' => 'nullable|array', 
            'kuota' => 'required|integer|min:1',
            'mahasiswa_ids' => 'nullable|array', 
            'mahasiswa_ids.*' => 'exists:users,id', 
            'pembimbing_ids' => 'required|array', 
        ]);

        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) return redirect()->back()->withErrors('Tahun Ajaran aktif belum diatur.');

        $status = 'Pending Kaprodi';
        if ($validated['tipe'] === 'Tipe 1') $status = 'Assigned';
        if ($validated['tipe'] === 'Tipe 2') $status = 'Matchmaking'; 

        $project = TaProject::create([
            'academic_year_id' => $activeYear->id,
            'tipe' => $validated['tipe'],
            'judul' => $validated['judul'],
            'deskripsi' => $validated['deskripsi'],
            'required_skills' => $validated['required_skills'] ?? [],
            'kuota' => $validated['tipe'] === 'Tipe 2' ? $validated['kuota'] : max(1, count($validated['mahasiswa_ids'] ?? [])),
            'pengusul_id' => $request->user()->id,
            'status' => $status,
        ]);

        if ($validated['tipe'] === 'Tipe 1' && !empty($validated['mahasiswa_ids'])) {
            $project->mahasiswas()->attach($validated['mahasiswa_ids']);
        } elseif ($validated['tipe'] === 'Mandiri') {
            $project->mahasiswas()->attach($request->user()->id);
        }

        foreach ($validated['pembimbing_ids'] as $index => $dosenId) {
            ProjectPembimbing::create([
                'ta_project_id' => $project->id,
                'dosen_id' => $dosenId,
                'role' => $index === 0 ? 'Utama' : 'Pendamping',
                'urutan' => $index + 1
            ]);
        }

        return redirect()->back()->with('success', 'Judul berhasil diajukan.');
    }

    public function approveMandiri(Request $request, $currentTeam, TaProject $project)
    {
        $project->update(['status' => 'Assigned']);
        return redirect()->back();
    }
}