<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Master Tahun Ajaran
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Contoh: "2026/2027"
            $table->enum('semester', ['Ganjil', 'Genap']);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // 2. Tabel Blueprint Timeline Induk
        Schema::create('timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('name'); 
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });

        // 3. Tabel Detail Milestones
        Schema::create('timeline_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timeline_id')->constrained('timelines')->cascadeOnDelete();
            $table->string('name'); // Label UI: "Bimbingan Proposal"
            $table->string('system_code')->nullable(); // Kode sistem: "bimbingan_proposal"
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });

        // 4. Modifikasi Tabel Eksisting (Isolasi Data)
        Schema::table('mahasiswa_profiles', function (Blueprint $table) {
            $table->foreignId('academic_year_id')->nullable()->after('prodi_id')->constrained('academic_years')->nullOnDelete();
        });

        Schema::table('milestone_schedules', function (Blueprint $table) {
            $table->foreignId('academic_year_id')->nullable()->after('mahasiswa_id')->constrained('academic_years')->nullOnDelete();
        });

        // Jika Anda sudah memiliki tabel bimbingans di database
        if (Schema::hasTable('bimbingans')) {
            Schema::table('bimbingans', function (Blueprint $table) {
                $table->foreignId('academic_year_id')->nullable()->after('user_id')->constrained('academic_years')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('bimbingans')) {
            Schema::table('bimbingans', function (Blueprint $table) {
                $table->dropForeign(['academic_year_id']);
                $table->dropColumn('academic_year_id');
            });
        }

        Schema::table('milestone_schedules', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn('academic_year_id');
        });

        Schema::table('mahasiswa_profiles', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn('academic_year_id');
        });

        Schema::dropIfExists('timeline_items');
        Schema::dropIfExists('timelines');
        Schema::dropIfExists('academic_years');
    }
};