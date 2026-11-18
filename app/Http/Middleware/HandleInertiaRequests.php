<?php

namespace App\Http\Middleware;

use App\Models\AcademicYear;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $isAdmin = false;
        $roleNames = [];

        if ($user) {
            $user->loadMissing('roles');
            $roleNames = $user->roles->pluck('name')->map(fn ($name) => strtolower($name))->toArray();

            $adminRoles = ['admin', 'administrator', 'panitia', 'panitia ta', 'kaprodi', 'super admin'];

            $isAdmin = $user->hasPermission('master.manage')
                || $user->hasPermission('rbac.manage')
                || count(array_intersect($roleNames, $adminRoles)) > 0;
        }

        // Logika Timeline Gatekeeper
        $activeYear = AcademicYear::where('is_active', true)->with('timelines.items')->first();
        $activePhases = [];
        $activeYearName = null;

        if ($activeYear && $activeYear->timelines->isNotEmpty()) {
            $activeYearName = $activeYear->name;
            $today = Carbon::today();

            $activePhases = $activeYear->timelines->first()->items->filter(function ($item) use ($today) {
                return $item->start_date && $item->end_date && $today->between($item->start_date, $item->end_date);
            })->pluck('system_code')->toArray();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'roles' => $roleNames,
                'permissions' => $user ? $user->all_permissions : [],
                'isAdmin' => $isAdmin,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],

            'timeline' => [
                'activeYear' => $activeYearName,
                'activePhases' => $activePhases,
                'isAdminOverride' => $isAdmin,
            ],
        ];
    }
}