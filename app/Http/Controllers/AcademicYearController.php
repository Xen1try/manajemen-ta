<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Timeline;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:academic_years,name',
            'semester' => 'required|in:Ganjil,Genap',
        ]);

        AcademicYear::create($validated);

        return redirect()->back();
    }

    // Fungsi penting untuk mematikan tahun lama dan mengaktifkan tahun baru
    public function setActive(Request $request, $currentTeam, AcademicYear $academicYear)
    {
        // Matikan semua tahun ajaran
        AcademicYear::query()->update(['is_active' => false]);
        
        // Aktifkan yang dipilih
        $academicYear->update(['is_active' => true]);

        return redirect()->back();
    }

    public function destroy($currentTeam, AcademicYear $academicYear)
    {
        $academicYear->delete();
        return redirect()->back();
    }
}