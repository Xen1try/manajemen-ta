<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prodis', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        Schema::create('competencies', function (Blueprint $table) {
            $table->id();
            $table->string('name'); 
            $table->string('code')->unique(); 
            $table->timestamps();
        });

        Schema::create('jabatan_fungsionals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('weight_score')->default(1);
            $table->integer('max_kuota_bimbingan')->default(5); // DI PINDAH KE SINI
            $table->timestamps();
        });

        Schema::create('dosen_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nip')->nullable();
            $table->foreignId('prodi_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('jabatan_fungsional_id')->nullable()->constrained('jabatan_fungsionals')->nullOnDelete();
            
            $table->integer('weight_score')->default(1); 
            $table->json('skill_vector')->nullable(); 
            // max_kuota_bimbingan DIHAPUS DARI SINI
            $table->timestamps();
        });

        Schema::create('mahasiswa_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nim')->nullable();
            $table->foreignId('prodi_id')->nullable()->constrained()->nullOnDelete();
            $table->year('angkatan')->nullable();
            
            $table->json('skill_vector')->nullable(); 
            $table->enum('academic_status', ['drafting', 'ready_sempro', 'ready_semhas', 'ready_sidang', 'lulus'])->default('drafting');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswa_profiles');
        Schema::dropIfExists('dosen_profiles');
        Schema::dropIfExists('jabatan_fungsionals');
        Schema::dropIfExists('competencies');
        Schema::dropIfExists('prodis');
    }
};