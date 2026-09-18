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

    protected function enforceTimelinePhase($systemCodeKeyword)
    {
        $user = request()->user();

        // 1. ADMIN OVERRIDE AMAN
        if ($user) {
            $user->loadMissing('roles');
            $roleNames = $user->roles->pluck('name')->map(fn($name) => strtolower($name))->toArray();
            $adminRoles = ['admin', 'administrator', 'panitia', 'kaprodi', 'super admin'];
            
            $isAdmin = $user->hasPermission('master.manage') || count(array_intersect($roleNames, $adminRoles)) > 0;

            if ($isAdmin) {
                return true; // Bypass Gatekeeper
            }
        }

        // 2. Validasi Reguler Mahasiswa & Dosen
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