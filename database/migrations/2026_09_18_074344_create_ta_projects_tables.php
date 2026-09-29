<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Utama Proyek/Judul TA
        Schema::create('ta_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            
            $table->enum('tipe', ['Tipe 1', 'Tipe 2', 'Mandiri']);
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            
            $table->json('required_skills')->nullable(); 
            $table->integer('kuota')->default(1); // Kolom baru untuk batas maksimal mahasiswa
            
            $table->foreignId('pengusul_id')->constrained('users'); 
            // mahasiswa_id DIHAPUS, dipindah ke tabel pivot
            
            $table->enum('status', [
                'Pending Kaprodi',
                'Matchmaking', 
                'Draft Plotting',
                'Assigned',
                'Ditolak'
            ])->default('Pending Kaprodi');
            
            $table->timestamps();
        });

        // 2. Tabel Pivot Mahasiswa Tim (Mendukung >1 Mahasiswa per Judul)
        Schema::create('project_mahasiswas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ta_project_id')->constrained('ta_projects')->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['ta_project_id', 'mahasiswa_id']); 
        });

        // 3. Tabel Pivot Pembimbing
        Schema::create('project_pembimbings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ta_project_id')->constrained('ta_projects')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('users'); 
            
            $table->enum('role', ['Utama', 'Pendamping'])->default('Pendamping');
            $table->integer('urutan')->default(1); 
            $table->timestamps();
            
            $table->unique(['ta_project_id', 'dosen_id']); 
        });

        // 4. Tabel Pemilihan Judul Mahasiswa (Tema Selection)
        Schema::create('tema_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('users'); 
            
            $table->foreignId('pilihan_1_id')->nullable()->constrained('ta_projects');
            $table->foreignId('pilihan_2_id')->nullable()->constrained('ta_projects');
            $table->foreignId('pilihan_3_id')->nullable()->constrained('ta_projects');
            
            $table->timestamp('locked_at')->nullable(); 
            $table->enum('status', ['Draft', 'Locked', 'Matched', 'Overridden'])->default('Draft');
            $table->timestamps();
            
            $table->unique(['academic_year_id', 'mahasiswa_id']); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tema_selections');
        Schema::dropIfExists('project_pembimbings');
        Schema::dropIfExists('project_mahasiswas');
        Schema::dropIfExists('ta_projects');
    }
};