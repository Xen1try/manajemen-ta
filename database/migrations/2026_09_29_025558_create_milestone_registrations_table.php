<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('milestone_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('users')->cascadeOnDelete();
            $table->string('milestone_type'); // Sempro, Semhas, Sidang
            $table->string('dokumen_kti_link')->nullable(); // Link Draft KTI
            $table->string('dokumen_produk_link')->nullable(); // Link Bukti Produk/Alat
            $table->string('bukti_pembayaran_link')->nullable(); // Untuk syarat lunas SPP
            $table->integer('jumlah_kehadiran_seminar')->default(0); // Syarat kehadiran
            $table->enum('status', ['draft', 'pending_pembimbing', 'approved', 'rejected'])->default('pending_pembimbing');
            $table->text('catatan_penolakan')->nullable();
            $table->timestamps();
            
            $table->unique(['mahasiswa_id', 'milestone_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('milestone_registrations');
    }
};