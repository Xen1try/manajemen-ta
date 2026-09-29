<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    // Helper terpusat untuk otorisasi dan Role Bypass (God Mode)
    protected function getUserRoleFlags($user)
    {
        $user->loadMissing('roles');
        $roleNames = $user->roles->pluck('name')->toArray();
        
        $isAdmin = $user->hasPermission('master.manage') || in_array('Admin', $roleNames);

        return (object) [
            'isAdmin' => $isAdmin,
            'isMahasiswa' => $isAdmin || in_array('Mahasiswa', $roleNames),
            'isPanitia' => $isAdmin || $user->hasPermission('master.manage') || !empty(array_intersect(['Kaprodi', 'Panitia'], $roleNames)),
            'isDosen' => $isAdmin || !empty(array_intersect(['Dosen Pembimbing', 'Penguji'], $roleNames)),
            // Daftar role yang sudah diinjeksi 'God Mode' (berguna untuk Profil Akademik)
            'activeRoleNames' => $isAdmin ? array_unique(array_merge($roleNames, ['Mahasiswa', 'Dosen Pembimbing', 'Panitia', 'Kaprodi'])) : $roleNames,
        ];
    }

    protected function enforceTimelinePhase($systemCodeKeyword)
    {
        $user = request()->user();

        // 1. ADMIN OVERRIDE AMAN (Menggunakan Helper)
        if ($user && $this->getUserRoleFlags($user)->isAdmin) {
            return true; 
        }

        // 2. Validasi Reguler
        $activeYear = AcademicYear::where('is_active', true)->with('timelines.items')->first();
        
        if (!$activeYear || $activeYear->timelines->isEmpty()) {
            abort(403, 'Tahun ajaran belum diatur oleh Panitia.');
        }

        $today = Carbon::today();
        $isOpen = $activeYear->timelines->first()->items->contains(function($item) use ($today, $systemCodeKeyword) {
            return str_contains($item->system_code, $systemCodeKeyword) &&
                   $item->start_date && $item->end_date &&
                   $today->between($item->start_date, $item->end_date);
        });

        if (!$isOpen) {
            abort(403, "Akses ditolak: Saat ini Anda berada di luar periode {$systemCodeKeyword}.");
        }
    }
}