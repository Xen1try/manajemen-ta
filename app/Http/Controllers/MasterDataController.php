<?php
namespace App\Http\Controllers;

use App\Models\Prodi;
use App\Models\Competency;
use App\Models\JabatanFungsional;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterDataController extends Controller
{
    public function index()
    {
        return Inertia::render('master-data', [
            'prodis' => Prodi::all(),
            'competencies' => Competency::all(),
            'jabatans' => JabatanFungsional::all(),
        ]);
    }

    public function storeProdi(Request $request) {
        Prodi::create($request->validate(['name' => 'required|string', 'code' => 'required|string|unique:prodis,code']));
        return redirect()->back();
    }
    public function destroyProdi($currentTeam, Prodi $prodi) { $prodi->delete(); return redirect()->back(); }

    public function storeCompetency(Request $request) {
        Competency::create($request->validate(['name' => 'required|string', 'code' => 'required|string|unique:competencies,code']));
        return redirect()->back();
    }
    public function destroyCompetency($currentTeam, Competency $competency) { $competency->delete(); return redirect()->back(); }

    public function storeJabatan(Request $request) {
        JabatanFungsional::create($request->validate([
            'name' => 'required|string', 
            'weight_score' => 'required|integer|min:1',
            'max_kuota_bimbingan' => 'required|integer|min:1' // Validasi tambahan
        ]));
        return redirect()->back();
    }
    public function destroyJabatan($currentTeam, JabatanFungsional $jabatan) { $jabatan->delete(); return redirect()->back(); }
}