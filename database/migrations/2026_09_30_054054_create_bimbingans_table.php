<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bimbingans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('ta_project_id')->nullable()->constrained('ta_projects')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Mahasiswa
            $table->foreignId('lecturer_id')->nullable()->constrained('users')->noActionOnDelete(); // Dosen Pembimbing
            $table->string('lecturer_name'); // Fallback / snapshot nama dosen
            $table->unsignedTinyInteger('pembimbing_ke')->default(1); // 1 = Pembimbing 1, 2 = Pembimbing 2
            $table->date('date');
            $table->string('topic');
            $table->text('notes');
            $table->string('next_action');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('lecturer_feedback')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bimbingans');
    }
};