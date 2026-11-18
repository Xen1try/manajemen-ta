<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\TaProject;
use App\Models\TemaSelection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchmakingController extends Controller
{
    public function lockChoices(Request $request)
    {
        $this->enforceTimelinePhase('pembagian_tema');

        $validated = $request->validate([
            'pilihan_1_id' => 'required|exists:ta_projects,id|different:pilihan_2_id|different:pilihan_3_id',
            'pilihan_2_id' => 'required|exists:ta_projects,id|different:pilihan_3_id',
            'pilihan_3_id' => 'required|exists:ta_projects,id',
        ], [
            'pilihan_1_id.different' => 'Pilihan 1, 2, dan 3 harus berupa topik yang berbeda.',
            'pilihan_2_id.different' => 'Pilihan 2 dan Pilihan 3 tidak boleh sama.',
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

        return redirect()->back()->with('success', 'Pilihan prioritas Anda berhasil dikunci!');
    }

    /**
     * Hitung persentase kecocokan vektor skill mahasiswa terhadap syarat topik (0 - 100%)
     */
    private function calculateMatchScore(array $studentSkills, array $requiredSkills): array
    {
        $filteredReqs = array_filter($requiredSkills, fn ($r) => (int) ($r['level'] ?? 1) > 1);
        if (empty($filteredReqs)) {
            return ['eligible' => true, 'score' => 100];
        }

        $studentMap = [];
        foreach ($studentSkills as $ss) {
            $studentMap[strtolower(trim($ss['name'] ?? ''))] = (int) ($ss['level'] ?? 1);
        }

        $eligible = true;
        $totalTarget = 0;
        $achievedScore = 0;

        foreach ($filteredReqs as $req) {
            $key = strtolower(trim($req['name'] ?? ''));
            $target = max(1, (int) ($req['level'] ?? 1));
            $actual = $studentMap[$key] ?? 1;

            if ($actual < $target) {
                $eligible = false;
            }

            $totalTarget += $target;
            $achievedScore += min($actual, $target); // Proporsi pemenuhan target
        }

        $percentage = $totalTarget > 0 ? (int) round(($achievedScore / $totalTarget) * 100) : 100;

        return ['eligible' => $eligible, 'score' => $percentage];
    }

    public function runAlgorithm(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (! $activeYear) {
            return redirect()->back()->withErrors(['error' => 'Tahun ajaran aktif belum diatur.']);
        }

        $matchedCount = 0;
        $unmatchedCount = 0;

        DB::transaction(function () use ($activeYear, &$matchedCount, &$unmatchedCount) {
            // 1. Reset hanya proyek Tipe 2 yang belum di-finalisasi ('Assigned')
            $projectsToReset = TaProject::where('academic_year_id', $activeYear->id)
                ->whereIn('status', ['Draft Plotting', 'Matchmaking'])
                ->where('tipe', 'Tipe 2')
                ->get();

            foreach ($projectsToReset as $proj) {
                $proj->mahasiswas()->detach();
                $proj->update(['status' => 'Matchmaking']);
            }

            // Ambil ID mahasiswa yang sudah terikat permanen di proyek Assigned (Tipe 1 / Mandiri / Finalized)
            $permanentlyAssignedIds = TaProject::where('academic_year_id', $activeYear->id)
                ->where('status', 'Assigned')
                ->with('mahasiswas:id')
                ->get()
                ->pluck('mahasiswas')
                ->flatten()
                ->pluck('id')
                ->unique()
                ->toArray();

            // 2. Tarik semua mahasiswa yang sudah mengunci pilihan (urut berdasarkan waktu kunci)
            $selections = TemaSelection::with('mahasiswa.mahasiswaProfile')
                ->where('academic_year_id', $activeYear->id)
                ->whereIn('status', ['Locked', 'Matched'])
                ->whereNotIn('mahasiswa_id', $permanentlyAssignedIds)
                ->orderBy('locked_at', 'asc')
                ->get();

            foreach ($selections as $selection) {
                $student = $selection->mahasiswa;
                if (! $student) {
                    continue;
                }

                $studentSkills = $student->mahasiswaProfile->skill_vector ?? [];
                $choices = array_filter([
                    $selection->pilihan_1_id,
                    $selection->pilihan_2_id,
                    $selection->pilihan_3_id,
                ]);

                $matched = false;

                foreach ($choices as $projectId) {
                    $project = TaProject::find($projectId);

                    if ($project && in_array($project->status, ['Matchmaking', 'Draft Plotting']) && $project->mahasiswas()->count() < $project->kuota) {
                        $eval = $this->calculateMatchScore($studentSkills, $project->required_skills ?? []);

                        if ($eval['eligible']) {
                            $project->mahasiswas()->attach($student->id);
                            $selection->update(['status' => 'Matched']);
                            $matched = true;
                            $matchedCount++;

                            // Ubah ke Draft Plotting begitu minimal 1 mahasiswa terpasang agar tampil di tab Hasil Plotting
                            if ($project->status === 'Matchmaking') {
                                $project->update(['status' => 'Draft Plotting']);
                            }
                            break;
                        }
                    }
                }

                if (! $matched) {
                    $selection->update(['status' => 'Locked']);
                    $unmatchedCount++;
                }
            }
        });

        return redirect()->back()->with(
            'success',
            "Matchmaking selesai: {$matchedCount} mahasiswa berhasil dipasangkan, {$unmatchedCount} menunggu plotting manual."
        );
    }

    public function overrideMatch(Request $request, $currentTeam, TaProject $project)
    {
        $validated = $request->validate(['mahasiswa_id' => 'required|exists:users,id']);
        $mahasiswaId = (int) $validated['mahasiswa_id'];

        $project->mahasiswas()->syncWithoutDetaching([$mahasiswaId]);

        if ($project->status === 'Matchmaking') {
            $project->update(['status' => 'Draft Plotting']);
        }

        TemaSelection::where('mahasiswa_id', $mahasiswaId)->update(['status' => 'Matched']);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditambahkan ke tim secara manual.');
    }

    /**
     * Lepas mahasiswa dari tim selama status proyek masih Draft Plotting
     */
    public function detachMember(Request $request, $currentTeam, TaProject $project, int $mahasiswaId)
    {
        abort_if($project->status === 'Assigned', 422, 'Tim yang sudah diresmikan tidak dapat diubah.');

        $project->mahasiswas()->detach($mahasiswaId);
        TemaSelection::where('mahasiswa_id', $mahasiswaId)->update(['status' => 'Locked']);

        if ($project->mahasiswas()->count() === 0 && $project->tipe === 'Tipe 2') {
            $project->update(['status' => 'Matchmaking']);
        }

        return redirect()->back()->with('success', 'Mahasiswa dikeluarkan dari draft tim.');
    }

    /**
     * Resmikan seluruh Draft Plotting menjadi Assigned permanen
     */
    public function finalizePlotting(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $updated = TaProject::where('academic_year_id', $activeYear?->id)
            ->where('status', 'Draft Plotting')
            ->update(['status' => 'Assigned']);

        return redirect()->back()->with('success', "{$updated} tim Draft Plotting berhasil diresmikan menjadi Assigned.");
    }
}