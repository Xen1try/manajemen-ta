<?php
namespace App\Http\Controllers;

use App\Models\Prodi;
use App\Models\Competency;
use App\Models\JabatanFungsional;
use App\Models\DosenProfile;
use App\Models\MahasiswaProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcademicProfileController extends Controller
{
    public function edit(Request $request)
    {
        $user = clone $request->user();
        $user->load(['dosenProfile', 'mahasiswaProfile', 'roles']);
        
        return Inertia::render('academic-profile', [
            'prodis' => Prodi::all(),
            'competencies' => Competency::all(),
            'jabatans' => JabatanFungsional::all(), // Kirim data jabatan ke React
            'userRoles' => $user->roles->pluck('name')->toArray(),
            'dosenProfile' => $user->dosenProfile ?? new DosenProfile(),
            'mahasiswaProfile' => $user->mahasiswaProfile ?? new MahasiswaProfile(),
        ]);
    }

    public function updateDosen(Request $request)
    {
        $validated = $request->validate([
            'nip' => 'nullable|string',
            'prodi_id' => 'required|exists:prodis,id',
            'jabatan_fungsional_id' => 'nullable|exists:jabatan_fungsionals,id',
            'skill_vector' => 'nullable|array',
            'max_kuota_bimbingan' => 'required|integer',
        ]);

        // Ambil weight score dinamis dari tabel jabatan
        $jabatan = JabatanFungsional::find($validated['jabatan_fungsional_id']);
        $validated['weight_score'] = $jabatan ? $jabatan->weight_score : 1;

        DosenProfile::updateOrCreate(['user_id' => $request->user()->id], $validated);
        return redirect()->back();
    }

    public function updateMahasiswa(Request $request)
    {
        $validated = $request->validate([
            'nim' => 'required|string',
            'prodi_id' => 'required|exists:prodis,id',
            'angkatan' => 'required|integer',
            'skill_vector' => 'nullable|array',
            'academic_status' => 'required|string',
        ]);

        MahasiswaProfile::updateOrCreate(['user_id' => $request->user()->id], $validated);
        return redirect()->back();
    }
}