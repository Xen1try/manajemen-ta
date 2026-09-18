<?php

namespace App\Http\Controllers;

use App\Models\Bimbingan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BimbinganController extends Controller
{
    // Menampilkan halaman bimbingan beserta data dari database
    public function index()
    {
        $bimbingans = Bimbingan::latest()->get();

        return Inertia::render('bimbingan', [
            'bimbingans' => $bimbingans,
        ]);
    }

    // Menyimpan data bimbingan baru dari form
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'lecturer_name' => 'required|string|max:255',
            'topic' => 'required|string|max:255',
            'notes' => 'required|string',
            'next_action' => 'required|string|max:255',
        ]);

        Bimbingan::create([
            'user_id' => auth()->id(),
            'date' => $validated['date'],
            'lecturer_name' => $validated['lecturer_name'],
            'topic' => $validated['topic'],
            'notes' => $validated['notes'],
            'next_action' => $validated['next_action'],
            'status' => 'Selesai',
        ]);

        return redirect()->back()->with('success', 'Catatan bimbingan berhasil disimpan.');
    }
}