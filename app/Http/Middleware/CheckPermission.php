<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Akses Ditolak: Silakan login terlebih dahulu.');
        }

        // Super Admin otomatis lolos semua pengecekan permission
        if ($user->roles()->where('name', 'Admin')->exists()) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if ($user->hasPermission(trim($permission))) {
                return $next($request);
            }
        }

        abort(403, 'Akses Ditolak: Anda tidak memiliki izin (' . implode(' / ', $permissions) . ').');
    }
}