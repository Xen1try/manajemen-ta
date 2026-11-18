<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seminar_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->nullable()->constrained()->noActionOnDelete();
            $table->foreignId('user_id')->constrained()->noActionOnDelete(); // Mahasiswa peserta/audiens
            $table->foreignId('milestone_schedule_id')->nullable()->constrained('milestone_schedules')->nullOnDelete();
            $table->string('seminar_title');
            $table->string('presenter_name');
            $table->string('milestone_type')->default('Sempro'); // Sempro / Semhas
            $table->date('date');
            $table->string('location')->nullable();
            $table->text('summary')->nullable(); // Ringkasan / poin materi yang disimak
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->noActionOnDelete();
            $table->text('verifier_notes')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seminar_attendances');
    }
};