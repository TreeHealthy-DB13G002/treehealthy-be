# TreeHealthy BE - Capstone Project Backend

TreeHealthy API adalah layanan RESTful API berbasis Node.js yang dirancang untuk mendukung aplikasi pemantauan kesehatan, analisis risiko diabetes, serta manajemen rencana aksi harian (*daily action plans*). Sistem ini dirancang menggunakan **Clean Architecture** (Arsitektur Bersih) yang modular guna memastikan skalabilitas, kemudahan pemeliharaan, serta performa yang optimal.

## Fitur Utama (Fase Awal)
- **Autentikasi & Otorisasi**: Registrasi pengguna dan login aman menggunakan enkripsi kata sandi `bcrypt` dan verifikasi akses berbasis `JSON Web Token (JWT)`.
- **Manajemen Profil Kesehatan**: Pencatatan data fisik (aktivitas harian, usia, jenis kelamin, tinggi, berat badan) beserta riwayat penyakit bawaan keluarga.
- **Kalkulator Medis Otomatis**: Perhitungan Indeks Massa Tubuh (BMI) instan lengkap dengan klasifikasi medis dan dampak risikonya terhadap diabetes secara otomatis di sisi backend.
- **Konversi Usia Terstandardisasi**: Skalabilitas klasifikasi umur pengguna (skala 1 - 13) guna pengolahan analisis data kesehatan tingkat lanjut.

---

## Teknologi & Dependensi Utama

- **Runtime Environment**: Node.js (ES Modules / `"type": "module"`)
- **Web Framework**: Express.js
- **Database**: PostgreSQL dengan raw SQL query (menggunakan driver `pg`)
- **Database Migration**: `node-pg-migrate`
- **Payload Validation**: `Joi`
- **Keamanan**: `jsonwebtoken` (JWT) & `bcrypt` (password hashing)

---

## Arsitektur & Struktur Direktori

Aplikasi ini menerapkan struktur folder modular yang memisahkan logika rute, pengontrol (*controller*), repositori query database, dan validator data untuk setiap fitur.

```text
treehealthy-api/
├── migrations/             # Berkas migrasi database (node-pg-migrate)
├── src/
│   ├── config/             # Konfigurasi aplikasi dan koneksi database
│   │   └── database.js
│   ├── exceptions/         # Custom Error Handler (ClientError, InvariantError, dll.)
│   │   ├── ClientError.js
│   │   ├── InvariantError.js
│   │   ├── AuthenticationError.js
│   │   └── NotFoundError.js
│   ├── middlewares/        # Middleware Express (Handler error terpusat, Autentikasi JWT)
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── services/           # Modul layanan per-fitur
│   │   └── users/
│   │       ├── routes.js
│   │       ├── controller.js
│   │       ├── repositories.js
│   │       └── validator.js
│   └── server.js           # Entry point utama aplikasi Express
├── .env                    # Variabel lingkungan untuk lokal/pengembangan
├── .prod.env               # Variabel lingkungan untuk produksi
├── .gitignore              # Berkas pengecualian unggahan Git
└── package.json

Langkah Instalasi & Penggunaan

1. Prasyarat Sistem

Pastikan perangkat Anda telah terpasang:

  - Node.js (versi 18.x ke atas direkomendasikan)
  - PostgreSQL (versi 14.x ke atas)

2. Kloning Repositori

git clone <url-repositori-github-anda>
cd treehealthy-api

3. Instalasi Dependensi

npm install

4. Konfigurasi Variabel Lingkungan (.env)

Buat file bernama .env di direktori utama (root) dan sesuaikan nilai variabel
berikut dengan kredensial database lokal Anda:

# Server Configuration
HOST=localhost
PORT=3000

# Node-Postgres Configuration
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=password_database_anda
PGDATABASE=treehealthy
PGPORT=5432

# JWT Token
ACCESS_TOKEN_KEY=9b3378b60048f49dfa7d7adcf8cebb8bcb9f732312972cdc71798d1a9cd379dfdbda0522ffbf40c8aa497e12a8eb0cf84e2fb5c6df5fa342ac044840c02ad73e
REFRESH_TOKEN_KEY=2c3639e1f3baa9ecf93ff76bb1d8e6b48262f1bca02bee4b8d93c49d2fd168de59c864f76918f57d76a03f62374577bc5cfa79abb477b2aa62e5e1d8ac444d70

Catatan Keamanan: Kunci ACCESS_TOKEN_KEY dan REFRESH_TOKEN_KEY di atas adalah
contoh. Untuk lingkungan produksi, Anda dapat menghasilkan string acak yang aman
dengan menjalankan perintah berikut di terminal: node -e
"console.log(require('crypto').randomBytes(64).toString('hex'))"

5. Jalankan Migrasi Database

Pastikan layanan PostgreSQL Anda aktif dan database bernama treehealthy sudah
dibuat. Jalankan perintah migrasi berikut untuk membentuk tabel-tabel database:

DATABASE_URL=postgres://<user>:<password>@<host>:<port>/treehealthy npm run migrate up

(Sesuaikan <user>, <password>, <host>, dan <port> dengan konfigurasi sistem
Anda)

6. Menjalankan Aplikasi

  - Mode Pengembangan (dengan Nodemon):
    npm run dev
  - Mode Produksi:
    npm start

Aplikasi secara default akan berjalan pada URL http://localhost:3000.

Dokumentasi Endpoint API

1. Cek Kesehatan Server

Memastikan server berjalan dengan normal.

  - URL: /health
  - Method: GET
  - Response (200 OK):
    {
      "status": "success",
      "message": "Server TreeHealthy berjalan dengan baik."
    }

2. Registrasi Pengguna Baru

  - URL: /users/register
  - Method: POST
  - Payload (JSON):
    {
      "fullname": "Budi Santoso",
      "username": "budisantoso",
      "password": "securepassword123"
    }
  - Response (201 Created):
    {
      "status": "success",
      "message": "Registrasi berhasil.",
      "data": {
        "userId": 1
      }
    }

3. Masuk Akun (Login)

  - URL: /users/login
  - Method: POST
  - Payload (JSON):
    {
      "username": "budisantoso",
      "password": "securepassword123"
    }
  - Response (200 OK):
    {
      "status": "success",
      "message": "Login berhasil.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }

4. Perbarui Profil Kesehatan (Membutuhkan Login)

Mengirimkan data profil kesehatan fisik beserta riwayat genetik penyakit bawaan
keluarga.

  - URL: /users/profile
  - Method: PUT
  - Headers:
      - Authorization: Bearer <token_jwt>
  - Payload (JSON):
    {
      "activities": "working",
      "age": 28,
      "gender": 1,
      "height": 170.0,
      "weight": 70.0,
      "family_diseases": ["diabetes", "hipertensi"]
    }
  - Response (200 OK):
    {
      "status": "success",
      "message": "Profil kesehatan berhasil diperbarui.",
      "data": {
        "profile": {
          "id": 1,
          "activities": "working",
          "age_scale": 2,
          "gender": "male",
          "height": 170,
          "weight": 70
        },
        "health_analysis": {
          "bmi": 24.2,
          "classification": "Kelebihan Berat Badan (Overweight)",
          "risk_effect": "Waspada (Resistensi insulin mulai naik)"
        }
      }
    }

Kontribusi & Aturan Pengembangan

Jika Anda ingin berpartisipasi atau mengembangkan modul tambahan:

1.  Pastikan setiap penambahan fitur diletakkan di bawah subfolder
    src/services/[nama-layanan].
2.  Gunakan Joi untuk validasi parameter masukan baik di body maupun query
    parameters.
3.  Jangan pernah menulis kredensial database atau kunci rahasia (secret key)
    langsung di dalam kode program. Gunakan file .env.

