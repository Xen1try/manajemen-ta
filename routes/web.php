<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BimbinganController;
use App\Http\Controllers\RbacController;
use App\Http\Controllers\AcademicProfileController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia; 

Route::inertia('/', 'welcome')->name('home');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        
        // Modul Pengajuan Judul
        Route::post('ta-projects', [\App\Http\Controllers\TaProjectController::class, 'store'])->name('ta-projects.store');
        Route::post('ta-projects/{project}/approve', [\App\Http\Controllers\TaProjectController::class, 'approveMandiri'])->name('ta-projects.approve')->middleware('permission:master.manage');

        // Rute Halaman Utama Bursa & Pengajuan
        Route::get('tema-matchmaking', [\App\Http\Controllers\TaProjectController::class, 'index'])->name('tema-matchmaking.index');

        // Modul Matchmaking & Bursa
        Route::post('tema-matchmaking/lock', [\App\Http\Controllers\MatchmakingController::class, 'lockChoices'])->name('tema-matchmaking.lock');
        Route::post('tema-matchmaking/run-algorithm', [\App\Http\Controllers\MatchmakingController::class, 'runAlgorithm'])->name('tema-matchmaking.run-algorithm')->middleware('permission:master.manage');
        Route::post('tema-matchmaking/{project}/override', [\App\Http\Controllers\MatchmakingController::class, 'overrideMatch'])->name('tema-matchmaking.override')->middleware('permission:master.manage');
        
        Route::get('bimbingan', [BimbinganController::class, 'index'])->name('bimbingan');
        Route::post('bimbingan', [BimbinganController::class, 'store'])->name('bimbingan.store');

        Route::get('dokumen', function () { return Inertia::render('dokumen'); })->name('dokumen');
        Route::get('pengajuan-judul', function () { return Inertia::render('pengajuan-judul'); })->name('pengajuan-judul');
        Route::get('kehadiran-seminar', function () { return Inertia::render('kehadiran-seminar'); })->name('kehadiran-seminar');
        
        // Rute Penjadwalan Enterprise
        Route::get('jadwal', [\App\Http\Controllers\ScheduleController::class, 'index'])->name('jadwal');
        
        // Rute Khusus Dosen (Blok Waktu)
        Route::post('jadwal/blocks', [\App\Http\Controllers\ScheduleController::class, 'storeBlock'])->name('jadwal.blocks.store');
        Route::delete('jadwal/blocks/{block}', [\App\Http\Controllers\ScheduleController::class, 'destroyBlock'])->name('jadwal.blocks.destroy');

        // Rute Khusus Panitia
        Route::middleware(['permission:sidang.create'])->group(function () {
            Route::post('jadwal/generate', [\App\Http\Controllers\ScheduleController::class, 'generate'])->name('jadwal.generate');
            Route::post('jadwal/{schedule}/assignee', [\App\Http\Controllers\ScheduleController::class, 'updateAssignee'])->name('jadwal.assignee');
            Route::put('jadwal/{schedule}', [\App\Http\Controllers\ScheduleController::class, 'updateSchedule'])->name('jadwal.update'); // Rute Update Waktu
            Route::post('jadwal/{schedule}/publish', [\App\Http\Controllers\ScheduleController::class, 'publish'])->name('jadwal.publish');
        });

        // Route RBAC menggunakan Granular Permission[cite: 16]
        Route::middleware(['permission:rbac.manage'])->group(function () {
            Route::get('rbac', [RbacController::class, 'index'])->name('rbac');
            Route::post('rbac/users/{user}/roles/{role}', [RbacController::class, 'toggleUserRole'])->name('rbac.toggle-role');
            
            Route::post('rbac/roles', [RbacController::class, 'storeRole'])->name('rbac.roles.store');
            Route::delete('rbac/roles/{role}', [RbacController::class, 'destroyRole'])->name('rbac.roles.destroy');
            Route::post('rbac/roles/{role}/permissions', [RbacController::class, 'updatePermission'])->name('rbac.permissions.update');
        });

        // Route Master Data (Hanya untuk yang punya akses master.manage)
        Route::middleware(['permission:master.manage'])->group(function () {
            Route::get('master-data', [\App\Http\Controllers\MasterDataController::class, 'index'])->name('master.index');
            
            Route::post('master-data/prodi', [MasterDataController::class, 'storeProdi'])->name('master.prodi.store');
            Route::delete('master-data/prodi/{prodi}', [MasterDataController::class, 'destroyProdi'])->name('master.prodi.destroy');
            
            Route::post('master-data/competency', [MasterDataController::class, 'storeCompetency'])->name('master.competency.store');
            Route::delete('master-data/competency/{competency}', [MasterDataController::class, 'destroyCompetency'])->name('master.competency.destroy');
            
            Route::post('master-data/jabatan', [MasterDataController::class, 'storeJabatan'])->name('master.jabatan.store');
            Route::delete('master-data/jabatan/{jabatan}', [MasterDataController::class, 'destroyJabatan'])->name('master.jabatan.destroy');
        });

        // Rute Kontrol Tahun Ajaran & Timeline Blueprint
        Route::middleware(['permission:master.manage'])->group(function () {
            Route::post('academic-years', [\App\Http\Controllers\AcademicYearController::class, 'store'])->name('academic-years.store');
            Route::post('academic-years/{academicYear}/set-active', [\App\Http\Controllers\AcademicYearController::class, 'setActive'])->name('academic-years.set-active');
            Route::delete('academic-years/{academicYear}', [\App\Http\Controllers\AcademicYearController::class, 'destroy'])->name('academic-years.destroy');

            Route::get('timeline-kontrol', [\App\Http\Controllers\TimelineController::class, 'index'])->name('timeline.index');
            Route::post('academic-years/{academicYear}/generate-timeline', [\App\Http\Controllers\TimelineController::class, 'generateDefault'])->name('timeline.generate');

            // Timeline Kontrol & Blueprint
            Route::get('timeline-kontrol', [\App\Http\Controllers\TimelineController::class, 'index'])->name('timeline.index');
            Route::post('academic-years/{academicYear}/generate-timeline', [\App\Http\Controllers\TimelineController::class, 'generateDefault'])->name('timeline.generate');
            
            // Operasi Kustomisasi Timeline
            Route::post('timelines/{timeline}/items', [\App\Http\Controllers\TimelineController::class, 'storeItem'])->name('timeline.items.store');
            Route::put('timeline-items/{item}', [\App\Http\Controllers\TimelineController::class, 'updateItem'])->name('timeline.items.update');
            Route::delete('timeline-items/{item}', [\App\Http\Controllers\TimelineController::class, 'destroyItem'])->name('timeline.items.destroy');
            Route::post('timelines/{timeline}/reorder', [\App\Http\Controllers\TimelineController::class, 'reorderItems'])->name('timeline.items.reorder');
        });
        
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php'; // Rute settings bawaan laravel[cite: 16]