# Sistem Manajemen Tugas Akhir (`manajemen-ta`)

Aplikasi web terintegrasi untuk pengelolaan siklus Tugas Akhir di **Jurusan Teknik Otomasi Manufaktur & Mekatronika — Politeknik Manufaktur Bandung** (TRMO, TRO, TRIN).

Dibangun menggunakan **Laravel 13**, **Inertia.js v3**, **React 19 (TypeScript)**, **Tailwind CSS v4**, dan **Laravel Fortify (2FA & Passkeys)**.

---

## Fitur Utama

- **Dynamic RBAC & Auto-Discovery Permission**: Pengaturan role & matriks izin granular otomatis dari definisi route.
- **Master Data & Timeline Gatekeeper**: Pengelolaan Prodi, Kompetensi (*skill vector*), Jabatan Fungsional & Kuota, Tahun Ajaran aktif, serta penguncian fase waktu otomatis.
- **Bursa Judul & Vector Matchmaking**: Mendukung topik Tipe 1, Tipe 2 (pencocokan otomatis berbasis FCFS + kecocokan *skill vector* + *manual override*), dan Judul Mandiri.
- **Logbook Bimbingan & Arsip Dokumen TA**: Verifikasi bimbingan Pembimbing 1 & 2, unggah 6 kategori dokumen (maks. 20 MB, *auto-versioning*), serta pengecekan skor plagiarisme iThenticate (≤ 25%).
- **Kehadiran Seminar Dual-Mode & Pendaftaran Milestone**: Pencatatan peserta oleh penyaji seminar dan validasi prasyarat Sempro, Semhas, serta Sidang Akhir secara ketat di sisi server.
- **Auto-Scheduler 3 Sesi/Hari Anti-Bentrok**: Penjadwalan ujian otomatis berdasarkan kalender ketersediaan dosen, pemerataan beban penguji (`Penguji ≠ Pembimbing`), dan anti-bentrok ruangan.

---

## Quick Start (Pengembangan Lokal)

### Prasyarat
- PHP `>= 8.3` (ekstensi `pdo_sqlite` / `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `xml`)
- Composer `>= 2.x`
- Node.js `>= 20.x` & npm

### Langkah Instalasi
```bash
# 1. Instal dependensi backend & frontend
composer install
npm install

# 2. Siapkan konfigurasi environment
copy .env.example .env
php artisan key:generate

# 3. Buat symlink storage publik (wajib untuk akses dokumen TA)
php artisan storage:link

# 4. Migrasi database & isi data skenario demo
php artisan migrate:fresh --seed

# 5. Jalankan server Laravel + queue + Vite HMR sekaligus
composer run dev
```

Aplikasi berjalan di `http://localhost:8000`.

### Akun Demo Bawaan
Semua akun seeder menggunakan password **`password`** (lihat [DatabaseSeeder.php](database/seeders/DatabaseSeeder.php)):
- **Admin**: `admin@polman-bandung.ac.id`
- **Dosen Pembimbing**: `harry@polman-bandung.ac.id`, `danu@polman-bandung.ac.id`, `budi@polman-bandung.ac.id`
- **Mahasiswa**: `arbiyan@polman-bandung.ac.id` (siap Sidang), `aqila@polman-bandung.ac.id` (siap Matchmaking), `zahra@polman-bandung.ac.id` (Judul Mandiri)

---

## Perintah Penting

```bash
composer run dev          # Jalankan Laravel server + queue + Vite dev
composer run test         # Bersihkan config + Pint check + PHPStan + Pest test
composer run ci:check     # Cek penuh (frontend check + tsc + Pint + PHPStan + Pest)
composer run lint         # Auto-format kode PHP dengan Laravel Pint
npm run types:check       # Cek tipe TypeScript (tsc --noEmit)
npm run build             # Build aset produksi Vite
```

---

## Dokumentasi Lengkap

| Dokumen | Deskripsi |
| :--- | :--- |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | **Panduan Programmer & Troubleshooting**: arsitektur, peta file per fitur, mekanisme `{current_team}`/RBAC/Timeline/Algoritma, *cookbook* tambah fitur, 12 kasus troubleshooting, dan daftar *tech debt*. |
| [docs/RPP_Manajemen_TA.md](docs/RPP_Manajemen_TA.md) | **Rancangan Perangkat Lunak (SDD)** dalam format Markdown + Mermaid (Arsitektur, Flowchart, ERD, Kamus Data, Pemetaan Endpoint & RTM). |
| [docs/RPP-Sistem Manajemen TA (Revisi).docx](docs/RPP-Sistem%20Manajemen%20TA%20(Revisi).docx) | **Dokumen Rencana Pelaksanaan Proyek (RPP)** resmi format Microsoft Word (11 Bab lengkap dengan diagram resolusi tinggi). |
