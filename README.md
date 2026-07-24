# TreeHealthy API - Backend Engine

TreeHealthy API adalah layanan RESTful API berbasis Node.js (Express.js) yang dirancang menggunakan **Clean Architecture** (Arsitektur Bersih) yang ter-decouple (terpisah) dari server kecerdasan buatan (FastAPI Python). Layanan ini mengelola data transaksional pengguna, checklist rencana sehat harian CERDIK Kemenkes RI, serta riwayat perkembangan status kesehatan pengguna.

---

## Fitur Utama

- **Autentikasi Pengguna & Otorisasi (`/api/auth`)**: Mengelola registrasi aman (`bcrypt` password hashing dengan kecocokan `confirm_password`) dan login menggunakan standar industri `JSON Web Token (JWT)`.
- **Penilaian Kesehatan Medis (`/api/assessment`)**: Pengisian data fisik (antropometri tubuh) dan penarikan kuesioner 11 indikator klinis CDC untuk menghitung risiko Penyakit Tidak Menular (PTM).
- **Dashboard CERDIK (`/api/dashboard`)**: Checklist aktivitas harian dinamis (Pilar CERDIK) terintegrasi dengan sistem perkembangan status pohon digital gamifikasi (*progressTree*) dan reset siklus mingguan otomatis.
- **Log Perjalanan & Grafik (`/api/journey-log` & `/api/analytics`)**: Rekam medis rekapitulasi kepatuhan mingguan, detail histori evaluasi, serta penyuplai koordinat grafik Recharts frontend.
- **Manajemen Akun (`/api/settings`)**: Formulir pengaturan profil terintegrasi dengan pembaruan data secara real-time dan pencatatan waktu pembaruan otomatis (`last_update`).

---

## Arsitektur decoupled (Koneksi ke FastAPI AI)

Sistem backend ini terhubung ke server kecerdasan buatan FastAPI (Python) secara asinkron menggunakan **Axios** pada rute penilaian risiko kesehatan (`POST /api/assessment/submit`) dan pembaruan profil (`PUT /api/settings/profile`).

Express.js bertindak sebagai orkestrator yang mengirimkan data fisik serta jawaban kuesioner ke FastAPI, menerima probabilitas klasifikasi XGBoost serta narasi penjelasan medis RAG Gemini API, lalu menyimpannya ke database PostgreSQL.

---

## Struktur Direktori Proyek

```text
treehealthy-be
├── migrations/             # Berkas migrasi database (node-pg-migrate)
├── src/
│   ├── config/             # Konfigurasi database pool dan Swagger
│   │   ├── database.js
│   │   └── swagger.js
│   ├── exceptions/         # Custom Error Handler (ClientError, InvariantError, dll.)
│   ├── middlewares/        # Middleware Express (Auth JWT, Error Handler)
│   ├── services/           # Modul layanan per-fitur (Modular)
│   │   ├── analytics/      # Pengolahan grafik performa harian
│   │   ├── assessment/     # Kuesioner kuis & jembatan Axios ke FastAPI
│   │   ├── auth/           # Otentikasi dan repositori database terpusat
│   │   ├── dashboard/      # Checklist CERDIK harian & status pohon
│   │   ├── journey-log/    # Log mingguan & riwayat evaluasi
│   │   └── settings/       # Manajemen form profil
│   └── server.js           # Berkas utama server Express
├── .env                    # Konfigurasi variabel lingkungan
├── package.json
└── README.md
Langkah Instalasi & Penggunaan Lokal
1. Prasyarat Sistem
Node.js (v18 ke atas)
PostgreSQL (v13 ke atas) dengan ekstensi pgvector terpasang.
2. Kloning dan Instalasi Dependensi
code
Bash
git clone <url-repositori-github-anda>
cd treehealthy-be
npm install
3. Konfigurasi Variabel Lingkungan (.env)
Buat berkas .env di root direktori proyek, lalu isi sebagai berikut:
code
Env
HOST=localhost
PORT=3000

PGUSER=postgres
PGPASSWORD=your_postgres_password
PGHOST=localhost
PGDATABASE=treehealthy
PGPORT=5432

ACCESS_TOKEN_KEY=generate_jwt_key_anda
REFRESH_TOKEN_KEY=generate_jwt_key_anda

# Alamat server AI FastAPI kelompok Anda
AI_SERVER_URL=http://localhost:8000
4. Migrasi & Seeding Database
Posisikan psql terminal Anda di database treehealthy, lalu jalankan migrasi untuk membentuk tabel dan mengisi otomatis 11 pertanyaan kuesioner medis:
code
Bash
npm run migrate up
5. Jalankan Server
code
Bash
npm run dev
Dokumentasi interaktif Swagger UI akan tersedia di: http://localhost:3000/api-docs
Spesifikasi Endpoint API (Format snake_case)
Tag	Method	Endpoint	Fungsi
Auth	POST	/api/auth/register	Mendaftarkan pengguna baru (confirm_password)
Auth	POST	/api/auth/login	Otentikasi masuk pengguna, mengembalikan Token & flag hasProfile
Assessment	POST	/api/assessment/profile	Menyimpan data antropometri tubuh sebelum kuesioner
Assessment	GET	/api/assessment/questions	Menarik daftar 11 pertanyaan klinis CDC dari database
Assessment	POST	/api/assessment/submit	Mengirim jawaban (answers), menghitung skor pilar & RAG Gemini
Assessment	POST	/api/assessment/generate-plan	Mengaktifkan siklus sehat 7 hari pertama
Dashboard	GET	/api/dashboard/current	Menampilkan checklist harian, status pohon, dan streak harian
Dashboard	PATCH	/api/dashboard/tasks/{taskId}/toggle	Mengubah status checklist harian & pertumbuhan pohon
Dashboard	POST	/api/dashboard/cycle-complete	Menyelesaikan evaluasi siklus mingguan (satisfaction_rating)
Journey Log	GET	/api/journey-log/summary	Menampilkan rekapitulasi data log mingguan global
Journey Log	GET	/api/journey-log/detail/{cycleId}	Menampilkan detail data histori evaluasi mingguan
Analytics	GET	/api/analytics/charts	Menyuplai koordinat grafik Recharts frontend
Settings	GET	/api/settings/profile	Memuat data profil & timestamp last_update terbaru
Settings	PUT	/api/settings/profile	Menyimpan pembaruan profil & memperbarui last_update