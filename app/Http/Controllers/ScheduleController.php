<?php

namespace App\Http\Controllers;

use App\Models\MilestoneSchedule;
use App\Models\ScheduleAssignee;
use App\Models\DosenBlock;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    private $blueprints = [
        'Sempro' => [
            'penguji_utama' => ['min_weight' => 2, 'count' => 1],
            'penguji_pendamping' => ['min_weight' => 1, 'count' => 1],
            'pembimbing' => ['min_weight' => 1, 'count' => 1, 'is_exception' => true]
        ],
        'Sidang' => [
            'penguji_utama' => ['min_weight' => 3, 'count' => 1],
            'penguji_pendamping' => ['min_weight' => 1, 'count' => 2],
            'pembimbing' => ['min_weight' => 1, 'count' => 1, 'is_exception' => true]
        ]
    ];

    public function index(Request $request)
    {
        $user = clone $request->user();
        $user->load('roles');

        $schedules = MilestoneSchedule::with(['mahasiswa:id,name', 'assignees.dosen:id,name'])->latest()->get();
        $dosens = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Dosen Pembimbing', 'Penguji']))
            ->with('dosenProfile.jabatanFungsional')->get();
            
        // Ambil blok waktu milik dosen yang sedang login (atau semua jika admin/panitia)
        $isDosen = $user->roles->whereIn('name', ['Dosen Pembimbing', 'Penguji'])->count() > 0;
        $blocks = $isDosen ? DosenBlock::where('user_id', $user->id)->latest()->get() : [];

        return Inertia::render('jadwal', [
            'schedules' => $schedules,
            'dosens' => $dosens,
            'myBlocks' => $blocks,
            'isDosen' => $isDosen,
        ]);
    }

    public function generate(Request $request)
    {
        $kandidat = User::whereHas('mahasiswaProfile', fn($q) => $q->where('academic_status', 'ready_sempro'))->get();
        $dosens = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Dosen Pembimbing', 'Penguji']))
            ->with('dosenProfile')->get();

        foreach ($kandidat as $mhs) {
            if (MilestoneSchedule::where('mahasiswa_id', $mhs->id)->exists()) continue;

            $schedule = MilestoneSchedule::create([
                'mahasiswa_id' => $mhs->id,
                'milestone_type' => 'Sempro',
                'date' => null, // Biarkan null, Panitia yang akan set waktu valid
                'room' => null,
                'status' => 'draft'
            ]);

            $utama = $dosens->filter(fn($d) => ($d->dosenProfile->weight_score ?? 1) >= 2)->first();
            if ($utama) ScheduleAssignee::create(['milestone_schedule_id' => $schedule->id, 'user_id' => $utama->id, 'role_type' => 'penguji_utama']);

            $pendamping = $dosens->filter(fn($d) => $d->id !== ($utama->id ?? 0))->first();
            if ($pendamping) ScheduleAssignee::create(['milestone_schedule_id' => $schedule->id, 'user_id' => $pendamping->id, 'role_type' => 'penguji_pendamping']);
            
            $pembimbing = $dosens->filter(fn($d) => $d->id !== ($utama->id ?? 0) && $d->id !== ($pendamping->id ?? 0))->first();
            if ($pembimbing) ScheduleAssignee::create(['milestone_schedule_id' => $schedule->id, 'user_id' => $pembimbing->id, 'role_type' => 'pembimbing']);
        }

        return redirect()->back();
    }

    // Override Data Jadwal (Waktu & Ruangan)
    public function updateSchedule(Request $request, $currentTeam, MilestoneSchedule $schedule)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time_start' => 'required',
            'time_end' => 'required',
            'room' => 'required|string',
        ]);
        $schedule->update($validated);
        return redirect()->back();
    }

    // Override Dosen (Soft Validation dengan Cek Blok Waktu)
    public function updateAssignee(Request $request, $currentTeam, MilestoneSchedule $schedule)
    {
        $request->validate(['user_id' => 'required', 'role_type' => 'required', 'force' => 'boolean']);
        
        $dosen = User::with('dosenProfile')->find($request->user_id);
        $blueprint = $this->blueprints[$schedule->milestone_type][$request->role_type] ?? null;

        if (!$request->force) {
            // 1. Validasi Weight Score
            if ($blueprint) {
                $weight = $dosen->dosenProfile->weight_score ?? 1;
                if ($weight < $blueprint['min_weight']) {
                    return response()->json(['warning' => true, 'message' => "Dosen (Weight {$weight}) tidak memenuhi syarat Blueprint (Min {$blueprint['min_weight']}). Tetap paksa?"], 422);
                }
            }

            // 2. Validasi Ketersediaan Waktu Dosen (Blokir)
            if ($schedule->date && $schedule->time_start) {
                $isBlocked = DosenBlock::where('user_id', $dosen->id)->where('date', $schedule->date)
                    ->where(function($q) use ($schedule) {
                        $q->whereBetween('time_start', [$schedule->time_start, $schedule->time_end])
                          ->orWhereBetween('time_end', [$schedule->time_start, $schedule->time_end]);
                    })->exists();

                if ($isBlocked) {
                    return response()->json(['warning' => true, 'message' => "Dosen ini telah memblokir waktu tersebut (Tidak Tersedia). Tetap paksa tugaskan?"], 422);
                }
            }
        }

        ScheduleAssignee::updateOrCreate(
            ['milestone_schedule_id' => $schedule->id, 'role_type' => $request->role_type],
            ['user_id' => $dosen->id]
        );
        return redirect()->back();
    }

    public function publish(Request $request, $currentTeam, MilestoneSchedule $schedule)
    {
        $schedule->update(['status' => 'published']);
        return redirect()->back();
    }

    // Manajemen Blok Waktu Dosen
    public function storeBlock(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time_start' => 'required',
            'time_end' => 'required',
            'reason' => 'required|string|max:255',
        ]);
        $validated['user_id'] = $request->user()->id;
        DosenBlock::create($validated);
        return redirect()->back();
    }

    public function destroyBlock($currentTeam, DosenBlock $block)
    {
        $block->delete();
        return redirect()->back();
    }
}