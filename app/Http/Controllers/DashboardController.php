<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Bimbingan;
use App\Models\MilestoneSchedule;
use App\Models\ScheduleAssignee;
use App\Models\SeminarAttendance;
use App\Models\TaProject;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        Carbon::setLocale('id');
        $todayFormatted = Carbon::now()->translatedFormat('l, d F Y');

        $isAdminOrPanitia = $user->hasPermission('master.manage')
            || $user->hasPermission('sidang.create')
            || $user->roles()->whereIn('name', ['Admin', 'Panitia TA', 'Kaprodi'])->exists();

        $isDosen = ! $isAdminOrPanitia && (
            $user->dosenProfile()->exists()
            || $user->roles()->whereIn('name', ['Dosen Pembimbing', 'Penguji'])->exists()
        );

        $activeYear = AcademicYear::where('is_active', true)->first();

        // =====================================================================
        // MODE 1: ADMIN / PANITIA TA / KAPRODI
        // =====================================================================
        if ($isAdminOrPanitia) {
            $totalMahasiswa = User::whereHas('mahasiswaProfile')->count();
            $totalProyekAktif = TaProject::where('status', '!=', 'Draft')->count();
            $proyekDraft = TaProject::where('status', 'Draft')->count();

            $draftSchedules = MilestoneSchedule::where('status', 'draft')->count();
            $publishedSchedules = MilestoneSchedule::where('status', 'published')->count();
            $pendingSeminarAttendances = SeminarAttendance::where('status', 'pending')->count();

            $upcomingSchedules = MilestoneSchedule::with(['mahasiswa:id,name', 'assignees.dosen:id,name'])
                ->whereNotNull('date')
                ->whereDate('date', '>=', Carbon::today())
                ->orderBy('date')
                ->take(5)
                ->get();

            $recentProjects = TaProject::with(['mahasiswas:id,name', 'pengusul:id,name'])
                ->latest()
                ->take(5)
                ->get();

            return Inertia::render('dashboard', [
                'roleView' => 'admin',
                'todayDate' => $todayFormatted,
                'activeYearName' => $activeYear?->name ?? 'Tahun Ajaran Aktif',
                'adminData' => [
                    'metrics' => [
                        'total_mahasiswa' => $totalMahasiswa,
                        'total_proyek' => $totalProyekAktif,
                        'proyek_draft' => $proyekDraft,
                        'draft_schedules' => $draftSchedules,
                        'published_schedules' => $publishedSchedules,
                        'pending_attendances' => $pendingSeminarAttendances,
                    ],
                    'upcomingSchedules' => $upcomingSchedules,
                    'recentProjects' => $recentProjects,
                ],
                'dosenData' => null,
                'studentData' => null,
            ]);
        }

        // =====================================================================
        // MODE 2: DOSEN PEMBIMBING / PENGUJI
        // =====================================================================
        if ($isDosen) {
            $bimbinganQuery = Bimbingan::where(function ($q) use ($user) {
                $q->where('lecturer_id', $user->id)
                    ->orWhere('lecturer_name', $user->name);
            });

            $totalBimbinganSesi = (clone $bimbinganQuery)->count();
            $pendingBimbinganCount = (clone $bimbinganQuery)->where('status', 'pending')->count();
            $recentBimbingans = (clone $bimbinganQuery)
                ->with('user:id,name')
                ->latest('date')
                ->take(4)
                ->get();

            // Daftar jadwal menguji atau mendampingi bimbingan
            $assignedScheduleIds = ScheduleAssignee::where('user_id', $user->id)
                ->pluck('milestone_schedule_id');

            $upcomingSchedules = MilestoneSchedule::with(['mahasiswa:id,name', 'assignees' => fn ($q) => $q->where('user_id', $user->id)])
                ->whereIn('id', $assignedScheduleIds)
                ->whereNotNull('date')
                ->whereDate('date', '>=', Carbon::today())
                ->orderBy('date')
                ->take(5)
                ->get();

            $pendingAttendancesCount = SeminarAttendance::where('status', 'pending')->count();

            $menteeProjectsCount = TaProject::whereHas('pembimbings', fn ($q) => $q->where('dosen_id', $user->id))->count();

            return Inertia::render('dashboard', [
                'roleView' => 'dosen',
                'todayDate' => $todayFormatted,
                'activeYearName' => $activeYear?->name ?? 'Tahun Ajaran Aktif',
                'adminData' => null,
                'dosenData' => [
                    'metrics' => [
                        'mentee_projects' => $menteeProjectsCount,
                        'pending_bimbingan' => $pendingBimbinganCount,
                        'total_bimbingan' => $totalBimbinganSesi,
                        'upcoming_exams' => $upcomingSchedules->count(),
                        'pending_attendances' => $pendingAttendancesCount,
                    ],
                    'upcomingSchedules' => $upcomingSchedules,
                    'recentBimbingans' => $recentBimbingans,
                ],
                'studentData' => null,
            ]);
        }

        // =====================================================================
        // MODE 3: MAHASISWA
        // =====================================================================
        $project = TaProject::with(['pembimbings.dosen:id,name'])
            ->whereHas('mahasiswas', fn ($q) => $q->where('users.id', $user->id))
            ->latest()
            ->first();

        $bimbingans = Bimbingan::where('user_id', $user->id)
            ->latest('date')
            ->get();

        $approvedBimbingan = $bimbingans->where('status', 'approved')->count();
        $pendingBimbingan = $bimbingans->where('status', 'pending')->count();

        $attendances = SeminarAttendance::where('user_id', $user->id)->get();
        $approvedAttendance = $attendances->where('status', 'approved')->count();
        $pendingAttendance = $attendances->where('status', 'pending')->count();

        $schedules = MilestoneSchedule::with(['assignees.dosen:id,name'])
            ->where('mahasiswa_id', $user->id)
            ->get();

        $semproSchedule = $schedules->where('milestone_type', 'Sempro')->first();
        $semhasSchedule = $schedules->where('milestone_type', 'Semhas')->first();
        $sidangSchedule = $schedules->where('milestone_type', 'Sidang')->first();

        $nextSchedule = $schedules
            ->filter(fn ($s) => $s->status === 'published' && $s->date && Carbon::parse($s->date)->gte(Carbon::today()))
            ->sortBy('date')
            ->first();

        // Cek skor iThenticate jika tabel dokumen sudah ada
        $ithenticateScore = null;
        if (Schema::hasTable('ta_documents')) {
            $doc = DB::table('ta_documents')
                ->where('user_id', $user->id)
                ->whereNotNull('similarity_score')
                ->orderByDesc('id')
                ->first();
            $ithenticateScore = $doc->similarity_score ?? null;
        }

        // Susun 4 tahapan milestone dinamis
        $hasProject = $project !== null && $project->status !== 'Draft';
        $semproDone = $semproSchedule && $semproSchedule->status === 'published' && $semproSchedule->date && Carbon::parse($semproSchedule->date)->lt(Carbon::today());
        $semhasDone = $semhasSchedule && $semhasSchedule->status === 'published' && $semhasSchedule->date && Carbon::parse($semhasSchedule->date)->lt(Carbon::today());
        $sidangDone = $sidangSchedule && $sidangSchedule->status === 'published' && $sidangSchedule->date && Carbon::parse($sidangSchedule->date)->lt(Carbon::today());

        $milestones = [
            [
                'title' => 'Penetapan Judul & Pembimbing',
                'date' => $project ? Carbon::parse($project->created_at)->translatedFormat('d M Y') : 'Belum diajukan',
                'done' => $hasProject,
                'current' => ! $hasProject,
            ],
            [
                'title' => 'Seminar Proposal (Sempro)',
                'date' => $semproSchedule?->date
                    ? Carbon::parse($semproSchedule->date)->translatedFormat('d M Y') . ($semproSchedule->room ? " · {$semproSchedule->room}" : '')
                    : 'Menunggu penjadwalan',
                'done' => $semproDone,
                'current' => $hasProject && ! $semproDone,
            ],
            [
                'title' => 'Seminar Hasil (Semhas)',
                'date' => $semhasSchedule?->date
                    ? Carbon::parse($semhasSchedule->date)->translatedFormat('d M Y') . ($semhasSchedule->room ? " · {$semhasSchedule->room}" : '')
                    : 'Menunggu penjadwalan',
                'done' => $semhasDone,
                'current' => $semproDone && ! $semhasDone,
            ],
            [
                'title' => 'Sidang Tugas Akhir',
                'date' => $sidangSchedule?->date
                    ? Carbon::parse($sidangSchedule->date)->translatedFormat('d M Y') . ($sidangSchedule->room ? " · {$sidangSchedule->room}" : '')
                    : 'Prasyarat min. 8 bimbingan & 5 seminar',
                'done' => $sidangDone,
                'current' => $semhasDone && ! $sidangDone,
            ],
        ];

        $pembimbingNames = $project
            ? $project->pembimbings->sortBy('urutan')->map(fn ($p) => $p->dosen?->name)->filter()->values()->all()
            : [];

        return Inertia::render('dashboard', [
            'roleView' => 'mahasiswa',
            'todayDate' => $todayFormatted,
            'activeYearName' => $activeYear?->name ?? 'Tahun Ajaran Aktif',
            'adminData' => null,
            'dosenData' => null,
            'studentData' => [
                'project' => $project ? [
                    'judul' => $project->judul,
                    'tipe' => $project->tipe,
                    'status' => $project->status,
                    'pembimbings' => $pembimbingNames,
                ] : null,
                'metrics' => [
                    'bimbingan_approved' => $approvedBimbingan,
                    'bimbingan_target' => 8,
                    'bimbingan_pending' => $pendingBimbingan,
                    'seminar_approved' => $approvedAttendance,
                    'seminar_target' => 5,
                    'seminar_pending' => $pendingAttendance,
                    'ithenticate_score' => $ithenticateScore,
                    'is_sidang_eligible' => $approvedBimbingan >= 8 && $approvedAttendance >= 5 && ($ithenticateScore === null || $ithenticateScore <= 25),
                ],
                'nextSchedule' => $nextSchedule ? [
                    'milestone_type' => $nextSchedule->milestone_type,
                    'date' => Carbon::parse($nextSchedule->date)->translatedFormat('d M Y'),
                    'time' => $nextSchedule->time_start ? substr($nextSchedule->time_start, 0, 5) : null,
                    'room' => $nextSchedule->room ?? 'Ruang Ujian',
                ] : null,
                'milestones' => $milestones,
                'recentBimbingans' => $bimbingans->take(3)->values(),
            ],
        ]);
    }
}