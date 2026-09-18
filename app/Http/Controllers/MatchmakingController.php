<?php

namespace App\Http\Controllers;

use App\Models\TemaSelection; // Gunakan model baru
use App\Models\TaProject;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class MatchmakingController extends Controller
{
    // Aksi Mahasiswa: Mengunci 3 pilihan dari Katalog
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
            [
                'academic_year_id' => $activeYear->id,
                'mahasiswa_id' => $request->user()->id,
            ],
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

    // Aksi Panitia: Menjalankan Algoritma Matchmaking
    public function runAlgorithm(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        // 1. Reset hasil plotting sebelumnya (Ubah status kembali ke Matchmaking)
        TaProject::where('academic_year_id', $activeYear->id)
            ->where('status', 'Draft Plotting')
            ->update(['mahasiswa_id' => null, 'status' => 'Matchmaking']);

        // 2. Tarik semua pilihan mahasiswa
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

                // Filter 3: Pastikan statusnya Matchmaking
                if ($project && $project->status === 'Matchmaking' && !$project->mahasiswa_id) {
                    
                    $reqSkills = $project->required_skills ?? [];
                    $isSkillMatch = empty($reqSkills) || count(array_intersect($studentSkills, $reqSkills)) > 0;

                    if ($isSkillMatch) {
                        $project->update([
                            'mahasiswa_id' => $student->id,
                            'status' => 'Draft Plotting' 
                        ]);
                        $selection->update(['status' => 'Matched']);
                        $matched = true;
                        break; 
                    }
                }
            }

            if (!$matched) {
                $selection->update(['status' => 'Locked']); 
            }
        }

        return redirect()->back()->with('success', 'Algoritma Matchmaking Selesai. Silakan review hasil Draft Plotting.');
    }

    public function overrideMatch(Request $request, $currentTeam, TaProject $project)
    {
        $request->validate(['mahasiswa_id' => 'required|exists:users,id']);
        
        $project->update([
            'mahasiswa_id' => $request->mahasiswa_id,
            'status' => 'Assigned' 
        ]);

        return redirect()->back();
    }
}