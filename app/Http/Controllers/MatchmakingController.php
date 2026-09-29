<?php

namespace App\Http\Controllers;

use App\Models\TemaSelection;
use App\Models\TaProject;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class MatchmakingController extends Controller
{
    public function lockChoices(Request $request)
    {
        $this->enforceTimelinePhase('pembagian_tema');

        $validated = $request->validate([
            'pilihan_1_id' => 'required|exists:ta_projects,id',
            'pilihan_2_id' => 'required|exists:ta_projects,id',
            'pilihan_3_id' => 'required|exists:ta_projects,id',
        ]);

        $activeYear = AcademicYear::where('is_active', true)->first();

        TemaSelection::updateOrCreate(
            ['academic_year_id' => $activeYear->id, 'mahasiswa_id' => $request->user()->id],
            [
                'pilihan_1_id' => $validated['pilihan_1_id'],
                'pilihan_2_id' => $validated['pilihan_2_id'],
                'pilihan_3_id' => $validated['pilihan_3_id'],
                'status' => 'Locked',
                'locked_at' => now(), 
            ]
        );
        return redirect()->back()->with('success', 'Pilihan berhasil dikunci!');
    }

    public function runAlgorithm(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        // 1. Reset mahasiswa dari proyek Tipe 2 yang sebelumnya berstatus Matchmaking/Draft
        $projectsToReset = TaProject::where('academic_year_id', $activeYear->id)
            ->whereIn('status', ['Draft Plotting', 'Matchmaking'])
            ->where('tipe', 'Tipe 2')
            ->get();

        foreach ($projectsToReset as $proj) {
            $proj->mahasiswas()->detach(); // Kosongkan tim
            $proj->update(['status' => 'Matchmaking']); // Buka kembali loket
        }

        // 2. Tarik semua pilihan (First-Come First-Serve)
        $selections = TemaSelection::where('academic_year_id', $activeYear->id)
            ->whereIn('status', ['Locked', 'Matched'])
            ->orderBy('locked_at', 'asc') 
            ->get();

        foreach ($selections as $selection) {
            $student = $selection->mahasiswa;
            $studentSkills = $student->mahasiswaProfile->skill_vector ?? [];
            $choices = [$selection->pilihan_1_id, $selection->pilihan_2_id, $selection->pilihan_3_id];
            $matched = false;

            foreach ($choices as $projectId) {
                if (!$projectId) continue;
                $project = TaProject::find($projectId);

                // Cek apakah status Matchmaking dan KUOTA MASIH TERSEDIA
                if ($project && $project->status === 'Matchmaking' && $project->mahasiswas()->count() < $project->kuota) {
                    
                    $reqSkills = $project->required_skills ?? []; 
                    $isSkillMatch = true;

                    if (!empty($reqSkills)) {
                        foreach ($reqSkills as $req) {
                            $reqName = strtolower(trim($req['name']));
                            $reqLevel = (int)$req['level'];
                            $found = false;

                            foreach ($studentSkills as $ss) {
                                if (strtolower(trim($ss['name'])) === $reqName && (int)$ss['level'] >= $reqLevel) {
                                    $found = true;
                                    break;
                                }
                            }
                            if (!$found) { $isSkillMatch = false; break; }
                        }
                    }

                    if ($isSkillMatch) {
                        // Masukkan mahasiswa ini ke dalam tim proyek
                        $project->mahasiswas()->attach($student->id);
                        $selection->update(['status' => 'Matched']);
                        $matched = true;
                        
                        // Jika setelah dimasukkan kuotanya penuh, tutup pintunya (Ubah status)
                        if ($project->mahasiswas()->count() >= $project->kuota) {
                            $project->update(['status' => 'Draft Plotting']);
                        }
                        break; 
                    }
                }
            }
            if (!$matched) { $selection->update(['status' => 'Locked']); }
        }

        return redirect()->back()->with('success', 'Algoritma Matchmaking Selesai. Silakan review hasil Draft Plotting.');
    }

    public function overrideMatch(Request $request, $currentTeam, TaProject $project)
    {
        $request->validate(['mahasiswa_id' => 'required|exists:users,id']);
        // Override menambahkan mahasiswa secara paksa
        $project->mahasiswas()->syncWithoutDetaching([$request->mahasiswa_id]);
        return redirect()->back();
    }
}