<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dosen_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->string('reason')->nullable(); // Alasan (misal: "Mengajar Kelas Mekatronika")
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dosen_blocks');
    }
};