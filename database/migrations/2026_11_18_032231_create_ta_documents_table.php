<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ta_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Mahasiswa pengunggah
            $table->string('category'); // proposal, laporan_semhas, laporan_akhir, ithenticate, orisinalitas, produk
            $table->string('title');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_size')->nullable(); // Misal: 2.4 MB
            $table->decimal('similarity_score', 5, 2)->nullable(); // Khusus iThenticate (<= 25.00%)
            $table->unsignedInteger('version')->default(1);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->noActionOnDelete();
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ta_documents');
    }
};