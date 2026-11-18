<?php

namespace App\Http\Controllers;

use App\Models\MilestoneSchedule;
use App\Models\SeminarAttendance;
use App\Models\TaProject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SeminarAttendanceController extends Controller
{
    private function isVerifier($user): bool
    {
        return $user->hasPermission('sidang.create')
            || $user->hasPermission('master.manage')
            || $user->dosenProfile()->exists()
            || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Dosen Pembimbing', 'Penguji'])->exists();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isVerifier = $this->isVerifier($user);

        // 1. TAMPILAN PANITIA / DOSEN (Validasi Daftar Hadir)
        if ($isVerifier) {
            $attendances = SeminarAttendance::with([
                'user:id,name,email',
                'verifier:id,name',
            ])
                ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
                ->latest('date')
                ->get();

            $students = $attendances
                ->pluck('user')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn ($mhs) => [
                    'id' => $mhs->id,
                    'name' => $mhs->name,
                ]);

            return Inertia::render('kehadiran-seminar', [
                'isVerifier' => true,
                'myAttendances' => [],
                'mySeminars' => [],
                'eligibleStudents' => [],
                'attendances' => $attendances,
                'students' => $students,
                'summary' => null,
            ]);
        }

        // 2. TAMPILAN MAHASISWA
        // A. READ-ONLY (R): Riwayat seminar yang dihadiri mahasiswa ini sebagai peserta
        $myAttendances = SeminarAttendance::with(['verifier:id,name'])
            ->where('user_id', $user->id)
            ->latest('date')
            ->get();

        $approvedCount = $myAttendances->where('status', 'approved')->count();
        $pendingCount = $myAttendances->where('status', 'pending')->count();
        $totalCount = $myAttendances->count();
        $lastAttended = $myAttendances->where('status', 'approved')->first() ?? $myAttendances->first();

        // B. CRUD PENYAJI: Daftar jadwal seminar milik mahasiswa ini
        $presenterSchedules = MilestoneSchedule::where('mahasiswa_id', $user->id)
            ->whereIn('milestone_type', ['Sempro', 'Semhas'])
            ->latest('date')
            ->get();

        $myProject = TaProject::whereHas('mahasiswas', fn ($q) => $q->where('users.id', $user->id))
            ->latest()
            ->first();

        $mySeminars = $presenterSchedules->map(function ($sched) use ($myProject, $user) {
            $attendees = SeminarAttendance::with(['user:id,name,email'])
                ->where('milestone_schedule_id', $sched->id)
                ->latest()
                ->get();

            return [
                'id' => $sched->id,
                'milestone_type' => $sched->milestone_type,
                'seminar_title' => $myProject?->judul ?? "{$sched->milestone_type} - {$user->name}",
                'date' => $sched->date,
                'location' => $sched->room ?? 'Ruang Seminar',
                'status' => $sched->status,
                'attendees' => $attendees,
            ];
        })->values();

        // Kandidat mahasiswa peserta untuk dipilih pemilik seminar
        $eligibleStudents = User::whereHas('mahasiswaProfile')
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        if ($eligibleStudents->isEmpty()) {
            $eligibleStudents = User::whereDoesntHave('dosenProfile')
                ->where('id', '!=', $user->id)
                ->orderBy('name')
                ->get(['id', 'name', 'email']);
        }

        return Inertia::render('kehadiran-seminar', [
            'isVerifier' => false,
            'myAttendances' => $myAttendances,
            'mySeminars' => $mySeminars,
            'eligibleStudents' => $eligibleStudents,
            'attendances' => [],
            'students' => [],
            'summary' => [
                'approved' => $approvedCount,
                'pending' => $pendingCount,
                'total' => $totalCount,
                'target' => 5,
                'is_eligible' => $approvedCount >= 5,
                'last_date' => $lastAttended?->date,
            ],
        ]);
    }

    /**
     * CREATE (Pemilik Seminar): Menambahkan satu atau banyak mahasiswa yang hadir.
     */
    public function storeByPresenter(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'milestone_schedule_id' => 'required|exists:milestone_schedules,id',
            'attendee_ids' => 'required|array|min:1',
            'attendee_ids.*' => 'exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $schedule = MilestoneSchedule::findOrFail($validated['milestone_schedule_id']);

        abort_unless(
            (int) $schedule->mahasiswa_id === (int) $user->id,
            403,
            'Anda hanya dapat mengelola daftar hadir pada jadwal seminar milik Anda sendiri.'
        );

        $myProject = TaProject::whereHas('mahasiswas', fn ($q) => $q->where('users.id', $user->id))
            ->latest()
            ->first();

        $seminarTitle = $myProject?->judul ?? "{$schedule->milestone_type} - {$user->name}";
        $addedCount = 0;

        foreach ($validated['attendee_ids'] as $attendeeId) {
            if ((int) $attendeeId === (int) $user->id) {
                continue;
            }

            $exists = SeminarAttendance::where('milestone_schedule_id', $schedule->id)
                ->where('user_id', $attendeeId)
                ->exists();

            if (! $exists) {
                SeminarAttendance::create([
                    'team_id' => $user->current_team_id,
                    'user_id' => $attendeeId,
                    'milestone_schedule_id' => $schedule->id,
                    'seminar_title' => $seminarTitle,
                    'presenter_name' => $user->name,
                    'milestone_type' => $schedule->milestone_type,
                    'date' => $schedule->date ?? now()->toDateString(),
                    'location' => $schedule->room ?? 'Ruang Seminar',
                    'summary' => $validated['notes'] ?: "Hadir sebagai peserta seminar ({$user->name}).",
                    'status' => 'pending',
                ]);
                $addedCount++;
            }
        }

        return redirect()->back()->with('success', "{$addedCount} peserta berhasil ditambahkan ke daftar hadir seminar.");
    }

    /**
     * UPDATE (Pemilik Seminar): Memperbarui data/catatan peserta yang hadir selama belum approved.
     */
    public function updateByPresenter(Request $request, string $currentTeam, SeminarAttendance $attendance)
    {
        $user = $request->user();
        $schedule = $attendance->schedule;

        $isPresenterOwner = $schedule && (int) $schedule->mahasiswa_id === (int) $user->id;
        abort_unless($isPresenterOwner, 403, 'Anda tidak berhak mengubah data kehadiran ini.');
        abort_if($attendance->status === 'approved', 422, 'Data kehadiran yang sudah diverifikasi tidak dapat diubah.');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'summary' => 'nullable|string|max:500',
        ]);

        abort_if((int) $validated['user_id'] === (int) $user->id, 422, 'Penyaji tidak dapat ditambahkan sebagai peserta.');

        // Cegah duplikasi jika mengganti nama mahasiswa ke mahasiswa yang sudah ada di sesi ini
        $duplicate = SeminarAttendance::where('milestone_schedule_id', $schedule->id)
            ->where('user_id', $validated['user_id'])
            ->where('id', '!=', $attendance->id)
            ->exists();

        if ($duplicate) {
            return redirect()->back()->withErrors([
                'user_id' => 'Mahasiswa tersebut sudah terdaftar di daftar hadir seminar ini.',
            ]);
        }

        $attendance->update([
            'user_id' => $validated['user_id'],
            'summary' => $validated['summary'] ?: "Hadir sebagai peserta seminar ({$user->name}).",
            'status' => 'pending', // Reset ke pending jika sebelumnya rejected
        ]);

        return redirect()->back()->with('success', 'Data kehadiran peserta berhasil diperbarui.');
    }

    /**
     * DELETE (Pemilik Seminar): Menghapus peserta dari daftar hadir selama belum approved.
     */
    public function destroy(Request $request, string $currentTeam, SeminarAttendance $attendance)
    {
        $user = $request->user();
        $schedule = $attendance->schedule;

        $isPresenterOwner = $schedule && (int) $schedule->mahasiswa_id === (int) $user->id;
        abort_unless($isPresenterOwner, 403, 'Anda tidak berhak menghapus data kehadiran ini.');
        abort_if($attendance->status === 'approved', 422, 'Kehadiran yang sudah diverifikasi tidak dapat dihapus.');

        $attendance->delete();

        return redirect()->back()->with('success', 'Peserta berhasil dihapus dari daftar hadir seminar.');
    }

    /**
     * VERIFY (Panitia TA / Dosen): Memvalidasi daftar hadir seminar.
     */
    public function verify(Request $request, string $currentTeam, SeminarAttendance $attendance)
    {
        $user = $request->user();

        abort_unless($this->isVerifier($user), 403, 'Anda tidak memiliki hak verifikasi presensi.');

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'verifier_notes' => 'nullable|string|max:1000',
        ]);

        $attendance->update([
            'status' => $validated['status'],
            'verified_by' => $user->id,
            'verifier_notes' => $validated['verifier_notes'] ?? null,
            'verified_at' => now(),
        ]);

        $msg = $validated['status'] === 'approved'
            ? 'Kehadiran seminar berhasil diverifikasi.'
            : 'Kehadiran seminar ditolak.';

        return redirect()->back()->with('success', $msg);
    }
}