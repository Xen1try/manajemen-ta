<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\DosenAvailability;
use App\Models\MilestoneRegistration;
use App\Models\MilestoneSchedule;
use App\Models\ScheduleAssignee;
use App\Models\TaProject;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    /**
     * Definisi 3 Sesi Standar Harian (Pagi, Siang, Sore)
     */
    private array $dailySessions = [
        'pagi' => ['label' => 'Sesi Pagi', 'start' => '08:30:00', 'end' => '10:00:00'],
        'siang' => ['label' => 'Sesi Siang', 'start' => '10:30:00', 'end' => '12:00:00'],
        'sore' => ['label' => 'Sesi Sore', 'start' => '13:30:00', 'end' => '15:00:00'],
    ];

    /**
     * Daftar Ruangan Ujian Default Polman
     */
    private array $defaultRooms = [
        'Ruang Sidang 1 (Gedung Direktorat)',
        'Ruang Sidang 2 (Jurusan AE/TOMM)',
        'Lab. Rekayasa Perangkat Lunak (RPL)',
        'Ruang Rapat Jurusan',
    ];

    public function index(Request $request)
    {
        $user = $request->user();
        $activeYear = AcademicYear::where('is_active', true)->first();

        $isAdminOrPanitia = $user->hasPermission('sidang.create')
            || $user->hasPermission('master.manage')
            || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Kaprodi'])->exists();

        $isDosen = $user->dosenProfile()->exists()
            || $user->roles()->whereIn('name', ['Dosen Pembimbing', 'Penguji'])->exists();

        $schedulesQuery = MilestoneSchedule::with([
            'mahasiswa:id,name,email',
            'assignees.dosen.dosenProfile.prodi',
            'assignees.dosen.dosenProfile.jabatanFungsional',
        ])->latest('date');

        // Jika murni Mahasiswa, tampilkan jadwal published (atau jadwal miliknya sendiri)
        if (! $isAdminOrPanitia && ! $isDosen) {
            $schedulesQuery->where(function ($q) use ($user) {
                $q->where('status', 'published')
                    ->orWhere('mahasiswa_id', $user->id);
            });
        }

        $schedules = $schedulesQuery->get();

        $dosens = User::whereHas('dosenProfile')
            ->with(['dosenProfile.prodi', 'dosenProfile.jabatanFungsional', 'availabilities'])
            ->orderBy('name')
            ->get();

        $myAvailabilities = $isDosen
            ? DosenAvailability::where('user_id', $user->id)->orderBy('date')->get()
            : [];

        return Inertia::render('jadwal', [
            'schedules' => $schedules,
            'dosens' => $dosens,
            'myAvailabilities' => $myAvailabilities,
            'activeMilestoneStr' => $request->query('milestone', 'Sempro'),
            'isDosen' => $isDosen,
            'roleFlags' => [
                'isAdmin' => $isAdminOrPanitia,
                'isDosen' => $isDosen,
            ],
            'rooms' => $this->defaultRooms,
        ]);
    }

    /**
     * ENGINE PENJADWALAN OTOMATIS (3 Sesi/Hari + Auto-Balancing Beban Dosen + Anti-Bentrok Ruangan)
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'milestone_type' => 'required|in:Sempro,Semhas,Sidang',
            'start_date' => 'nullable|date',
            'rooms' => 'nullable|array',
        ]);

        $milestoneType = $validated['milestone_type'];
        $activeYear = AcademicYear::where('is_active', true)->first();
        $rooms = ! empty($validated['rooms']) ? $validated['rooms'] : $this->defaultRooms;
        $minStartDate = ! empty($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->toDateString()
            : Carbon::today()->addDays(2)->toDateString();

        // 1. Cari kandidat mahasiswa yang siap dijadwalkan & belum punya jadwal milestone ini
        $alreadyScheduledIds = MilestoneSchedule::where('milestone_type', $milestoneType)
            ->pluck('mahasiswa_id')
            ->toArray();

        $registeredIds = MilestoneRegistration::where('milestone_type', $milestoneType)
            ->whereNotIn('mahasiswa_id', $alreadyScheduledIds)
            ->pluck('mahasiswa_id')
            ->toArray();

        // Fallback: Jika belum ada yang submit form pendaftaran, ambil mahasiswa dari proyek TA aktif
        if (empty($registeredIds)) {
            $registeredIds = TaProject::where('status', '!=', 'Draft')
                ->with('mahasiswas:id')
                ->get()
                ->pluck('mahasiswas')
                ->flatten()
                ->pluck('id')
                ->unique()
                ->reject(fn ($id) => in_array($id, $alreadyScheduledIds))
                ->values()
                ->toArray();
        }

        if (empty($registeredIds)) {
            return redirect()->back()->with('error', "Semua kandidat mahasiswa untuk {$milestoneType} sudah memiliki jadwal atau belum ada kandidat aktif.");
        }

        // 2. Muat semua dosen beserta bobot beban & tanggal ketersediaan (>= minStartDate)
        $allDosens = User::whereHas('dosenProfile')
            ->with(['dosenProfile.prodi', 'dosenProfile.jabatanFungsional'])
            ->get();

        if ($allDosens->count() < 2) {
            return redirect()->back()->with('error', 'Minimal dibutuhkan 2 dosen aktif di sistem untuk menjalankan penjadwalan otomatis.');
        }

        $availabilitiesByDosen = DosenAvailability::whereDate('date', '>=', $minStartDate)
            ->orderBy('date')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows->pluck('date')->map(fn ($d) => Carbon::parse($d)->toDateString())->unique()->values()->all());

        // Kumpulan seluruh tanggal tersedia di kalender dosen
        $allCandidateDates = $availabilitiesByDosen->flatten()->unique()->sort()->values()->all();

        // Fallback tanggal 14 hari kerja ke depan jika dosen belum ada yang mengisi slot kalender
        if (empty($allCandidateDates)) {
            $cursor = Carbon::parse($minStartDate);
            for ($i = 0; $i < 14; $i++) {
                if (! $cursor->isWeekend()) {
                    $allCandidateDates[] = $cursor->toDateString();
                }
                $cursor->addDay();
            }
        }

        // 3. Peta okupansi eksisting (tanggal + sesi + dosen/ruangan) agar tidak pernah bentrok
        $existingSchedules = MilestoneSchedule::with('assignees')
            ->whereNotNull('date')
            ->whereNotNull('time_start')
            ->get();

        $busyDosenSlots = []; // ['2026-11-20|08:30:00|user_id' => true]
        $busyRoomSlots = [];  // ['2026-11-20|08:30:00|room' => true]
        $dosenLoadCount = []; // ['user_id' => total_assigned]

        foreach ($existingSchedules as $ex) {
            $dateKey = Carbon::parse($ex->date)->toDateString();
            $timeKey = strlen($ex->time_start) === 5 ? "{$ex->time_start}:00" : $ex->time_start;
            if ($ex->room) {
                $busyRoomSlots["{$dateKey}|{$timeKey}|{$ex->room}"] = true;
            }
            foreach ($ex->assignees as $asg) {
                $busyDosenSlots["{$dateKey}|{$timeKey}|{$asg->user_id}"] = true;
                $dosenLoadCount[$asg->user_id] = ($dosenLoadCount[$asg->user_id] ?? 0) + 1;
            }
        }

        $generatedCount = 0;

        DB::transaction(function () use (
            $registeredIds,
            $milestoneType,
            $activeYear,
            $allDosens,
            $availabilitiesByDosen,
            $allCandidateDates,
            $rooms,
            &$busyDosenSlots,
            &$busyRoomSlots,
            &$dosenLoadCount,
            &$generatedCount
        ) {
            foreach ($registeredIds as $mahasiswaId) {
                $project = TaProject::with(['pembimbings.dosen.dosenProfile', 'mahasiswas.mahasiswaProfile'])
                    ->whereHas('mahasiswas', fn ($q) => $q->where('users.id', $mahasiswaId))
                    ->latest()
                    ->first();

                $mahasiswa = User::with('mahasiswaProfile')->find($mahasiswaId);
                $mhsProdiId = $mahasiswa?->mahasiswaProfile?->prodi_id;

                // Tentukan Pembimbing dari proyek TA
                $pembimbings = $project ? $project->pembimbings->sortBy('urutan')->values() : collect();
                $pembimbing1Id = $pembimbings->get(0)?->dosen_id;
                $pembimbing2Id = $pembimbings->get(1)?->dosen_id;

                $excludedIds = array_filter([$pembimbing1Id, $pembimbing2Id]);

                // Urutkan kandidat penguji berdasarkan: Prodi sama + Beban kerja paling sedikit + Weight Score
                $candidateExaminers = $allDosens
                    ->reject(fn ($d) => in_array($d->id, $excludedIds))
                    ->sortBy(function ($d) use ($mhsProdiId, $dosenLoadCount) {
                        $sameProdiPenalty = ($mhsProdiId && $d->dosenProfile?->prodi_id === $mhsProdiId) ? 0 : 100;
                        $currentLoad = $dosenLoadCount[$d->id] ?? 0;
                        $weight = max(1, (int) ($d->dosenProfile?->weight_score ?? 1));
                        return $sameProdiPenalty + ($currentLoad * 10) - $weight;
                    })
                    ->values();

                // Susun komposisi tim sesuai milestone
                $teamRoles = [];
                if ($milestoneType === 'Sidang') {
                    if ($candidateExaminers->get(0)) $teamRoles['penguji_utama'] = $candidateExaminers->get(0)->id;
                    if ($candidateExaminers->get(1)) $teamRoles['penguji_pendamping_1'] = $candidateExaminers->get(1)->id;
                    if ($candidateExaminers->get(2)) $teamRoles['penguji_pendamping_2'] = $candidateExaminers->get(2)->id;
                    if ($pembimbing1Id) $teamRoles['pembimbing_utama'] = $pembimbing1Id;
                } else {
                    if ($candidateExaminers->get(0)) $teamRoles['penguji_utama'] = $candidateExaminers->get(0)->id;
                    if ($candidateExaminers->get(1)) $teamRoles['penguji_pendamping'] = $candidateExaminers->get(1)->id;
                    if ($pembimbing1Id) $teamRoles['pembimbing_utama'] = $pembimbing1Id;
                    if ($pembimbing2Id) $teamRoles['pembimbing_pendamping'] = $pembimbing2Id;
                }

                $teamUserIds = array_values($teamRoles);

                // 4. Cari kombinasi (Tanggal + Sesi Pagi/Siang/Sore + Ruangan) terbaik
                $chosenDate = null;
                $chosenSession = null;
                $chosenRoom = null;

                // Urutkan tanggal berdasarkan berapa banyak dosen di tim ini yang tersedia pada tanggal tersebut
                $rankedDates = collect($allCandidateDates)->sortByDesc(function ($date) use ($teamUserIds, $availabilitiesByDosen) {
                    $availableCount = 0;
                    foreach ($teamUserIds as $uid) {
                        if (in_array($date, $availabilitiesByDosen->get($uid, []))) {
                            $availableCount++;
                        }
                    }
                    return $availableCount;
                })->values();

                foreach ($rankedDates as $date) {
                    foreach ($this->dailySessions as $session) {
                        $timeStart = $session['start'];

                        // Pastikan TIDAK ADA satupun anggota tim yang bentrok di tanggal + sesi ini
                        $hasDosenConflict = false;
                        foreach ($teamUserIds as $uid) {
                            if (isset($busyDosenSlots["{$date}|{$timeStart}|{$uid}"])) {
                                $hasDosenConflict = true;
                                break;
                            }
                        }
                        if ($hasDosenConflict) {
                            continue;
                        }

                        // Cari ruangan yang kosong pada tanggal + sesi ini
                        foreach ($rooms as $room) {
                            if (! isset($busyRoomSlots["{$date}|{$timeStart}|{$room}"])) {
                                $chosenDate = $date;
                                $chosenSession = $session;
                                $chosenRoom = $room;
                                break 3; // Slot sempurna ditemukan!
                            }
                        }
                    }
                }

                // Fallback ekstrem jika semua slot penuh: tambah hari baru setelah tanggal terakhir
                if (! $chosenDate) {
                    $fallbackDate = Carbon::parse(end($allCandidateDates) ?: $minStartDate)->addDay();
                    while ($fallbackDate->isWeekend()) {
                        $fallbackDate->addDay();
                    }
                    $chosenDate = $fallbackDate->toDateString();
                    $chosenSession = $this->dailySessions['pagi'];
                    $chosenRoom = $rooms[0];
                }

                // Simpan Draft Jadwal
                $schedule = MilestoneSchedule::create([
                    'mahasiswa_id' => $mahasiswaId,
                    'academic_year_id' => $activeYear?->id,
                    'milestone_type' => $milestoneType,
                    'date' => $chosenDate,
                    'time_start' => $chosenSession['start'],
                    'time_end' => $chosenSession['end'],
                    'room' => $chosenRoom,
                    'status' => 'draft',
                ]);

                // Simpan Assignees & Tandai Okupansi Slot
                $busyRoomSlots["{$chosenDate}|{$chosenSession['start']}|{$chosenRoom}"] = true;

                foreach ($teamRoles as $roleType => $uid) {
                    ScheduleAssignee::create([
                        'milestone_schedule_id' => $schedule->id,
                        'user_id' => $uid,
                        'role_type' => $roleType,
                    ]);

                    $busyDosenSlots["{$chosenDate}|{$chosenSession['start']}|{$uid}"] = true;
                    $dosenLoadCount[$uid] = ($dosenLoadCount[$uid] ?? 0) + 1;
                }

                $generatedCount++;
            }
        });

        return redirect()->back()->with('success', "Berhasil men-generate {$generatedCount} draft jadwal {$milestoneType} (3 Sesi/Hari tanpa bentrok).");
    }

    /**
     * Override / Penetapan Dosen Penguji atau Pembimbing secara manual oleh Panitia
     */
    public function updateAssignee(Request $request, string $currentTeam, MilestoneSchedule $schedule)
    {
        $validated = $request->validate([
            'role_type' => 'required|string',
            'user_id' => 'required|exists:users,id',
            'force' => 'boolean',
        ]);

        $force = $request->boolean('force');
        $dosen = User::findOrFail($validated['user_id']);

        // Cek ketersediaan dosen pada tanggal tersebut jika belum force override
        if (! $force && $schedule->date) {
            $dateStr = Carbon::parse($schedule->date)->toDateString();
            $hasAvailabilities = DosenAvailability::where('user_id', $dosen->id)->exists();
            $isAvailableOnDate = DosenAvailability::where('user_id', $dosen->id)
                ->whereDate('date', $dateStr)
                ->exists();

            if ($hasAvailabilities && ! $isAvailableOnDate) {
                return redirect()->back()->withErrors([
                    'warning' => 'availability_mismatch',
                    'message' => "{$dosen->name} tidak menandai tanggal {$dateStr} sebagai slot tersedia di kalendernya. Tetap paksa tugaskan?",
                ]);
            }
        }

        ScheduleAssignee::updateOrCreate(
            [
                'milestone_schedule_id' => $schedule->id,
                'role_type' => $validated['role_type'],
            ],
            [
                'user_id' => $dosen->id,
            ]
        );

        return redirect()->back()->with('success', 'Susunan tim dosen berhasil diperbarui.');
    }

    /**
     * Edit Tanggal, Sesi Waktu, dan Ruangan
     */
    public function updateSchedule(Request $request, string $currentTeam, MilestoneSchedule $schedule)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time_start' => 'required',
            'time_end' => 'required',
            'room' => 'required|string|max:255',
        ]);

        $schedule->update($validated);

        return redirect()->back()->with('success', 'Waktu dan ruangan jadwal berhasil diperbarui.');
    }

    /**
     * Resmikan satu jadwal dari Draft -> Published
     */
    public function publish(Request $request, string $currentTeam, MilestoneSchedule $schedule)
    {
        $schedule->update(['status' => 'published']);

        return redirect()->back()->with('success', 'Jadwal berhasil diresmikan dan dipublikasikan ke mahasiswa & dosen.');
    }

    /**
     * Resmikan seluruh jadwal Draft pada milestone aktif sekaligus
     */
    public function publishAll(Request $request)
    {
        $validated = $request->validate([
            'milestone_type' => 'required|in:Sempro,Semhas,Sidang',
        ]);

        $updated = MilestoneSchedule::where('milestone_type', $validated['milestone_type'])
            ->where('status', 'draft')
            ->update(['status' => 'published']);

        return redirect()->back()->with('success', "{$updated} jadwal {$validated['milestone_type']} berhasil diresmikan sekaligus.");
    }

    /**
     * Simpan Ketersediaan Hari Dosen (Bulanan)
     */
    public function storeAvailability(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'dates' => 'array',
            'dates.*' => 'date',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $startOfMonth = Carbon::create($validated['year'], $validated['month'], 1)->startOfMonth()->toDateString();
        $endOfMonth = Carbon::create($validated['year'], $validated['month'], 1)->endOfMonth()->toDateString();

        DB::transaction(function () use ($user, $validated, $startOfMonth, $endOfMonth) {
            DosenAvailability::where('user_id', $user->id)
                ->whereBetween('date', [$startOfMonth, $endOfMonth])
                ->delete();

            foreach ($validated['dates'] ?? [] as $dateStr) {
                DosenAvailability::create([
                    'user_id' => $user->id,
                    'date' => $dateStr,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Ketersediaan tanggal Anda berhasil disimpan.');
    }

    public function destroyAvailability(Request $request, string $currentTeam, DosenAvailability $availability)
    {
        abort_unless((int) $availability->user_id === (int) $request->user()->id, 403);
        $availability->delete();

        return redirect()->back()->with('success', 'Slot tanggal dihapus.');
    }
}