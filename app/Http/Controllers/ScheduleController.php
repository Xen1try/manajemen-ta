<?php

namespace App\Http\Controllers;

use App\Models\MilestoneSchedule;
use App\Models\ScheduleAssignee;
use App\Models\DosenAvailability;
use App\Models\AcademicYear;
use App\Models\TaProject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    private $blueprints = [
        'Sempro' => ['trigger_status' => 'ready_sempro'],
        'Semhas' => ['trigger_status' => 'ready_semhas'],
        'Sidang' => ['trigger_status' => 'ready_sidang']
    ];

    public function index(Request $request)
    {
        $user = clone $request->user();
        $flags = $this->getUserRoleFlags($user);

        // Deteksi Timeline Aktif
        $activeYear = AcademicYear::where('is_active', true)->with('timelines.items')->first();
        $today = Carbon::today();
        $activeMilestone = 'Sempro';

        if ($activeYear && $activeYear->timelines->isNotEmpty()) {
            $items = $activeYear->timelines->first()->items;
            if ($items->contains(fn($i) => str_contains($i->system_code, 'sidang') && $today->between($i->start_date, $i->end_date))) {
                $activeMilestone = 'Sidang';
            } elseif ($items->contains(fn($i) => str_contains($i->system_code, 'semhas') && $today->between($i->start_date, $i->end_date))) {
                $activeMilestone = 'Semhas';
            } elseif ($items->contains(fn($i) => str_contains($i->system_code, 'sempro') && $today->between($i->start_date, $i->end_date))) {
                $activeMilestone = 'Sempro';
            }
        }

        $schedules = MilestoneSchedule::with(['mahasiswa:id,name', 'assignees.dosen:id,name'])->latest()->get();
        $dosens = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Dosen Pembimbing', 'Penguji']))
            ->with('dosenProfile.jabatanFungsional')->get();
            
        $availabilities = $flags->isDosen ? DosenAvailability::where('user_id', $user->id)->latest()->get() : [];

        return Inertia::render('jadwal', [
            'schedules' => $schedules,
            'dosens' => $dosens,
            'myAvailabilities' => $availabilities,
            'activeMilestoneStr' => $activeMilestone,
            'isDosen' => $flags->isDosen, 
            'roleFlags' => [
                'isDosen' => $flags->isDosen,
                'isAdmin' => $flags->isAdmin,
                'isPanitia' => $flags->isPanitia,
            ]
        ]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'milestone_type' => 'required|in:Sempro,Semhas,Sidang'
        ]);

        $type = $validated['milestone_type'];
        $blueprint = $this->blueprints[$type];

        // 1. Ambil Mahasiswa Kandidat
        $kandidat = User::whereHas('mahasiswaProfile', function($q) use ($blueprint) {
            $q->where('academic_status', $blueprint['trigger_status']);
        })->whereDoesntHave('milestoneSchedules', function($q) use ($type) {
            $q->where('milestone_type', $type);
        })->get();

        $semuaDosen = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Dosen Pembimbing', 'Penguji']))
            ->with(['dosenProfile.prodi', 'availabilities'])->get();

        $generatedCount = 0;

        foreach ($kandidat as $mhs) {
            // Tarik pembimbing via TaProject yang berstatus Assigned (Reverse Query aman dari ketiadaan relasi di User.php)
            $project = TaProject::whereHas('mahasiswas', fn($q) => $q->where('users.id', $mhs->id))
                ->where('status', '!=', 'Draft')->latest()->first();
            
            if (!$project) continue;

            $pembimbingIds = $project->pembimbings()->orderBy('urutan')->pluck('dosen_id')->toArray();
            if (empty($pembimbingIds)) continue;

            $pembimbingUtama = $semuaDosen->where('id', $pembimbingIds[0])->first();
            if (!$pembimbingUtama) continue;

            $tanggalTersediaPembimbing = $pembimbingUtama->availabilities->pluck('date')->toArray();
            $jadwalBerhasil = false;

            // 2. Pencarian Irisan Waktu
            foreach ($tanggalTersediaPembimbing as $tanggalUji) {
                
                // Cek kuota Pembimbing (Maks 3 sesi sehari)
                $pembimbingSesiHariIni = MilestoneSchedule::where('date', $tanggalUji)
                    ->whereHas('assignees', fn($q) => $q->where('user_id', $pembimbingUtama->id))->count();
                if ($pembimbingSesiHariIni >= 3) continue; 

                // Filter Dosen Tersedia & Cek Kuota (Maks 3 sesi sehari)
                $dosenTersediaDiTanggal = $semuaDosen->filter(function($dosen) use ($tanggalUji, $pembimbingIds) {
                    if (in_array($dosen->id, $pembimbingIds)) return false;
                    if (!$dosen->availabilities->contains('date', $tanggalUji)) return false;

                    $sesiHariIni = MilestoneSchedule::where('date', $tanggalUji)
                        ->whereHas('assignees', fn($q) => $q->where('user_id', $dosen->id))->count();
                    
                    return $sesiHariIni < 3;
                });

                // Helper Load Balancing: (Bulan * 10) + Hari ini -> Makin kecil makin diprioritaskan
                $scorer = function($d) use ($tanggalUji) {
                    $month = Carbon::parse($tanggalUji)->month;
                    $bulanIni = MilestoneSchedule::whereMonth('date', $month)
                        ->whereHas('assignees', fn($q) => $q->where('user_id', $d->id))->count();
                    $hariIni = MilestoneSchedule::where('date', $tanggalUji)
                        ->whereHas('assignees', fn($q) => $q->where('user_id', $d->id))->count();
                    return ($bulanIni * 10) + $hariIni;
                };

                $susunanPenguji = [];

                if ($type === 'Sidang') {
                    // LOGIKA SIDANG (3 Penguji, Lintas Prodi, Utamakan Bobot Jabatan)
                    $byProdi = $dosenTersediaDiTanggal->groupBy(fn($d) => $d->dosenProfile->prodi->code ?? 'OTHER');
                    $kandidatSidang = collect();

                    // Ambil 1 dari tiap prodi jika ada (TRMO, TRO, TRIN)
                    foreach (['TRMO', 'TRO', 'TRIN'] as $kodeProdi) {
                        if (isset($byProdi[$kodeProdi]) && $byProdi[$kodeProdi]->count() > 0) {
                            $terpilih = $byProdi[$kodeProdi]->sortBy($scorer)->first();
                            $kandidatSidang->push($terpilih);
                            $dosenTersediaDiTanggal = $dosenTersediaDiTanggal->reject(fn($d) => $d->id === $terpilih->id);
                        }
                    }

                    // Penuhi sisanya jika kurang dari 3 penguji
                    while ($kandidatSidang->count() < 3 && $dosenTersediaDiTanggal->count() > 0) {
                        $terpilih = $dosenTersediaDiTanggal->sortBy($scorer)->first();
                        $kandidatSidang->push($terpilih);
                        $dosenTersediaDiTanggal = $dosenTersediaDiTanggal->reject(fn($d) => $d->id === $terpilih->id);
                    }

                    if ($kandidatSidang->count() === 3) {
                        // Urutkan berdasarkan Jabatan Tertinggi (Weight Score) untuk menentukan Penguji Utama
                        $kandidatSidang = $kandidatSidang->sortByDesc(fn($d) => $d->dosenProfile->weight_score ?? 1)->values();
                        $susunanPenguji = [
                            ['role' => 'penguji_utama', 'id' => $kandidatSidang[0]->id],
                            ['role' => 'penguji_pendamping_1', 'id' => $kandidatSidang[1]->id],
                            ['role' => 'penguji_pendamping_2', 'id' => $kandidatSidang[2]->id],
                        ];
                    }
                } else {
                    // LOGIKA SEMPRO / SEMHAS (2 Penguji: Utama (Min. Lektor/2) & Pendamping)
                    $kandidatUtama = $dosenTersediaDiTanggal->filter(fn($d) => ($d->dosenProfile->weight_score ?? 1) >= 2)
                        ->sortBy($scorer)->first();
                    
                    if (!$kandidatUtama) {
                        $kandidatUtama = $dosenTersediaDiTanggal->sortBy($scorer)->first(); // Fallback jika tidak ada Lektor
                    }

                    if ($kandidatUtama) {
                        $dosenTersediaDiTanggal = $dosenTersediaDiTanggal->reject(fn($d) => $d->id === $kandidatUtama->id);
                        $kandidatPendamping = $dosenTersediaDiTanggal->sortBy($scorer)->first();

                        if ($kandidatPendamping) {
                            $susunanPenguji = [
                                ['role' => 'penguji_utama', 'id' => $kandidatUtama->id],
                                ['role' => 'penguji_pendamping', 'id' => $kandidatPendamping->id]
                            ];
                        }
                    }
                }

                // Jika Ditemukan Susunan yang Valid, Plot!
                if (!empty($susunanPenguji)) {
                    $schedule = MilestoneSchedule::create([
                        'mahasiswa_id' => $mhs->id,
                        'milestone_type' => $type,
                        'date' => $tanggalUji,
                        'status' => 'draft'
                    ]);

                    foreach ($pembimbingIds as $index => $pid) {
                        ScheduleAssignee::create([
                            'milestone_schedule_id' => $schedule->id, 
                            'user_id' => $pid, 
                            'role_type' => $index === 0 ? 'pembimbing_utama' : 'pembimbing_pendamping'
                        ]);
                    }

                    foreach ($susunanPenguji as $penguji) {
                        ScheduleAssignee::create([
                            'milestone_schedule_id' => $schedule->id, 
                            'user_id' => $penguji['id'], 
                            'role_type' => $penguji['role']
                        ]);
                    }

                    $jadwalBerhasil = true;
                    $generatedCount++;
                    break; 
                }
            }

            // Fallback (Blank Schedule)
            if (!$jadwalBerhasil) {
                MilestoneSchedule::create([
                    'mahasiswa_id' => $mhs->id,
                    'milestone_type' => $type,
                    'date' => null, 
                    'status' => 'draft'
                ]);
            }
        }

        return redirect()->back()->with('success', "$generatedCount Draft Jadwal $type berhasil di-generate dengan Auto-Balancing.");
    }

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

    public function updateAssignee(Request $request, $currentTeam, MilestoneSchedule $schedule)
    {
        $request->validate(['user_id' => 'required', 'role_type' => 'required', 'force' => 'boolean']);
        
        ScheduleAssignee::updateOrCreate(
            ['milestone_schedule_id' => $schedule->id, 'role_type' => $request->role_type],
            ['user_id' => $request->user_id]
        );
        return redirect()->back();
    }

    public function publish(Request $request, $currentTeam, MilestoneSchedule $schedule)
    {
        $schedule->update(['status' => 'published']);
        return redirect()->back();
    }

    public function storeAvailability(Request $request)
    {
        $validated = $request->validate([
            'dates' => 'array',
            'dates.*' => 'date',
            'year' => 'required|integer',
            'month' => 'required|integer',
        ]);
        
        $userId = $request->user()->id;

        DosenAvailability::where('user_id', $userId)
            ->whereYear('date', $validated['year'])
            ->whereMonth('date', $validated['month'])
            ->delete();

        if (!empty($validated['dates'])) {
            $inserts = collect($validated['dates'])->map(fn($date) => [
                'user_id' => $userId,
                'date' => $date,
                'time_start' => null,
                'time_end' => null,
                'keterangan' => 'Tersedia seharian',
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();
            
            DosenAvailability::insert($inserts);
        }

        return redirect()->back()->with('success', 'Jadwal ketersediaan berhasil disimpan.');
    }
}