<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Utama (Unified Engine)
        Schema::create('milestone_schedules', function (Blueprint $table) {
            $table->id();
            // Jalur 1: Mahasiswa diizinkan cascade
            $table->foreignId('mahasiswa_id')->constrained('users')->cascadeOnDelete();
            
            $table->string('milestone_type'); // Sempro, Semhas, Sidang
            $table->date('date')->nullable();
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->string('room')->nullable();
            
            $table->enum('status', ['draft', 'published', 'completed'])->default('draft');
            $table->timestamps();
        });

        // 2. Tabel Pivot Penugasan
        Schema::create('schedule_assignees', function (Blueprint $table) {
            $table->id();
            
            // Jadwal dihapus -> penugasan ikut terhapus
            $table->foreignId('milestone_schedule_id')->constrained()->cascadeOnDelete();
            
            // PERBAIKAN: Hapus cascadeOnDelete() agar menggunakan default NO ACTION SQL Server
            $table->foreignId('user_id')->constrained('users'); 
            
            $table->string('role_type'); // pembimbing, penguji_utama, penguji_pendamping
            $table->timestamps();
            
            $table->unique(['milestone_schedule_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_assignees');
        Schema::dropIfExists('milestone_schedules');
    }
};