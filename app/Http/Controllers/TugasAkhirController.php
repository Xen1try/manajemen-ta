<?php

namespace App\Http\Controllers;

use App\Models\TaProject;
use App\Models\ProjectPembimbing;
use App\Models\AcademicYear;
use App\Models\Competency; // Tambahkan import ini
use Illuminate\Http\Request;

class TaProjectController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $user = clone $request->user();
        $user->load('roles');

        $isMahasiswa = $user->roles->where('name', 'Mahasiswa')->isNotEmpty();
        $isPanitia = $user->hasPermission('master.manage') || $user->roles->whereIn('name', ['Kaprodi', 'Panitia'])->isNotEmpty();
        $isDosen = $user->roles->whereIn('name', ['Dosen Pembimbing', 'Penguji'])->isNotEmpty();

        $projects = TaProject::with(['pengusul', 'mahasiswa', 'pembimbings.dosen'])
            ->where('academic_year_id', $activeYear?->id)
            ->latest()->get();

        $temaSelection = null;
        if ($isMahasiswa) {
            $temaSelection = \App\Models\TemaSelection::where('academic_year_id', $activeYear?->id)
                ->where('mahasiswa_id', $user->id)->first();
        }

        $dosens = \App\Models\User::whereHas('roles', fn($q) => $q->whereIn('name', ['Dosen Pembimbing', 'Penguji']))->get(['id', 'name']);
        $mahasiswas = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'Mahasiswa'))->get(['id', 'name']);
        $competencies = Competency::orderBy('name', 'asc')->get(); // Tarik master data kompetensi

        return \Inertia\Inertia::render('tema-matchmaking', [
            'projects' => $projects,
            'temaSelection' => $temaSelection,
            'dosens' => $dosens,
            'mahasiswas' => $mahasiswas,
            'competencies' => $competencies, // Kirim ke React
            'roleFlags' => [
                'isMahasiswa' => $isMahasiswa,
                'isPanitia' => $isPanitia,
                'isDosen' => $isDosen,
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
            'mahasiswa_id' => 'nullable|exists:users,id', 
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
            'pengusul_id' => $request->user()->id,
            'mahasiswa_id' => $validated['tipe'] === 'Tipe 1' ? $validated['mahasiswa_id'] : ($validated['tipe'] === 'Mandiri' ? $request->user()->id : null),
            'status' => $status,
        ]);

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