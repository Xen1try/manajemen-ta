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
            $table->foreignId('mahasiswa_id')->constrained('users')->cascadeOnDelete();
            $table->string('milestone_type'); 
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
            $table->foreignId('milestone_schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users'); 
            $table->string('role_type'); 
            $table->timestamps();
            
            $table->unique(['milestone_schedule_id', 'user_id']);
        });

        // 3. Tabel Ketersediaan Dosen (Baru)
        Schema::create('dosen_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dosen_availabilities');
        Schema::dropIfExists('schedule_assignees');
        Schema::dropIfExists('milestone_schedules');
    }
};