<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Timeline;
use App\Models\TimelineItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimelineController extends Controller
{
    // Mengembalikan data ke UI React (Fase 3 nanti)
    public function index()
    {
        $academicYears = AcademicYear::with(['timelines.items'])->orderBy('created_at', 'desc')->get();
        
        return Inertia::render('timeline', [
            'academicYears' => $academicYears
        ]);
    }

    // Engine Generator: Membangun blueprint default jika belum ada
    public function generateDefault(Request $request, $currentTeam, AcademicYear $academicYear)
    {
        $timeline = Timeline::firstOrCreate(
            ['academic_year_id' => $academicYear->id],
            ['name' => 'Timeline Tugas Akhir ' . $academicYear->name]
        );

        // Hanya generate jika timeline masih kosong
        if ($timeline->items()->count() === 0) {
            $milestones = [
                ['name' => 'Pembagian Tema', 'system_code' => 'pembagian_tema'],
                ['name' => 'Bimbingan Proposal', 'system_code' => 'bimbingan_proposal'],
                ['name' => 'Seminar Proposal (Sempro)', 'system_code' => 'sempro'],
                ['name' => 'Bimbingan Tugas Akhir', 'system_code' => 'bimbingan_ta'],
                ['name' => 'Seminar Hasil (Semhas)', 'system_code' => 'semhas'],
                ['name' => 'Bimbingan Revisi', 'system_code' => 'bimbingan_revisi'],
                ['name' => 'Sidang Akhir', 'system_code' => 'sidang'],
            ];

            foreach ($milestones as $index => $ms) {
                TimelineItem::create([
                    'timeline_id' => $timeline->id,
                    'name' => $ms['name'],
                    'system_code' => $ms['system_code'],
                    'order_index' => $index + 1,
                ]);
            }
        }

        return redirect()->back();
    }

    // 1. Update Fase (Termasuk Nama dan Tanggal)
    public function updateItem(Request $request, $currentTeam, TimelineItem $item)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);
        $item->update($validated);
        return redirect()->back();
    }

    // 2. Tambah Fase Kustom Baru
    public function storeItem(Request $request, $currentTeam, Timeline $timeline)
    {
        $validated = $request->validate(['name' => 'required|string']);
        
        $maxOrder = $timeline->items()->max('order_index') ?? 0;
        
        TimelineItem::create([
            'timeline_id' => $timeline->id,
            'name' => $validated['name'],
            'system_code' => 'custom_' . time(), // Kode unik untuk fase kustom
            'order_index' => $maxOrder + 1,
        ]);
        return redirect()->back();
    }

    // 3. Hapus Fase
    public function destroyItem($currentTeam, TimelineItem $item)
    {
        $item->delete();
        return redirect()->back();
    }

    // 4. Update Urutan (Reorder)
    public function reorderItems(Request $request, $currentTeam, Timeline $timeline)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:timeline_items,id',
            'items.*.order_index' => 'required|integer',
        ]);

        foreach ($request->items as $itemData) {
            TimelineItem::where('id', $itemData['id'])->update(['order_index' => $itemData['order_index']]);
        }
        return redirect()->back();
    }
}