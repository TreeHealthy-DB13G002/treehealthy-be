/* eslint-disable camelcase */

export const shorthands = undefined;

export const up = (pgm) => {
  // 1. Masukkan Pertanyaan secara otomatis saat migrate up
  pgm.sql(`
    INSERT INTO assessment_questions (id, question_text, category) VALUES
    (1, 'Apakah Anda pernah dinyatakan memiliki riwayat tekanan darah tinggi (Hipertensi) oleh dokter atau tenaga medis?', 'tensi'),
    (2, 'Apakah Anda pernah didiagnosis oleh dokter memiliki penyakit jantung koroner atau pernah mengalami serangan jantung?', 'tensi'),
    (3, 'Sepanjang hidup Anda, apakah Anda sudah pernah merokok total minimal 100 batang (atau sekitar 5 bungkus rokok)?', 'fisik_stress'),
    (4, 'Dalam sebulan terakhir, seberapa sering Anda mengonsumsi minuman beralkohol dalam jumlah banyak sekaligus?', 'fisik_stress'),
    (5, 'Di luar aktivitas pekerjaan utama Anda, apakah Anda sempat meluangkan waktu untuk berolahraga, berjalan kaki, atau berkebun dalam sebulan terakhir?', 'fisik_stress'),
    (6, 'Secara rata-rata, seberapa sering Anda mengonsumsi buah-buahan segar dalam seminggu?', 'gula_darah'),
    (7, 'Secara rata-rata, apakah menu makanan harian Anda selalu dilengkapi dengan sayuran?', 'gula_darah'),
    (8, 'Dalam 1 tahun terakhir, pernahkah Anda terpaksa batal atau menunda pergi berobat ke dokter saat sakit akibat kendala biaya?', 'fisik_stress'),
    (9, 'Apakah Anda memiliki gangguan kesehatan fisik yang membuat Anda kesulitan atau merasa nyeri berat saat berjalan atau menaiki tangga?', 'tensi'),
    (10, 'Dalam 30 hari terakhir, berapa hari Anda merasakan kondisi mental yang kurang baik (seperti stres, cemas, sedih, atau emosi tidak stabil)?', 'fisik_stress'),
    (11, 'Dalam 30 hari terakhir, berapa hari aktivitas harian Anda terganggu akibat kondisi tubuh yang sedang sakit, cedera, atau drop?', 'fisik_stress')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Selaraskan kembali nomor sequence ID di database
  pgm.sql("ALTER SEQUENCE assessment_questions_id_seq RESTART WITH 12;");

  // 2. Masukkan Pilihan Jawaban secara otomatis saat migrate up
  pgm.sql(`
    INSERT INTO assessment_options (question_id, option_text, score_weight) VALUES
    (1, 'Tidak, tekanan darah saya selalu normal setiap kali diperiksa', 0),
    (1, 'Pernah, tetapi hanya saat masa kehamilan saja', 0),
    (1, 'Ya, saya memiliki riwayat tekanan darah tinggi berdasarkan diagnosis medis', 1),
    (2, 'Tidak pernah, kondisi jantung saya dinyatakan sehat dan normal', 0),
    (2, 'Sering merasa dada sesak atau berdebar, tetapi belum pernah memeriksakannya ke dokter', 0),
    (2, 'Ya, saya memiliki riwayat penyakit jantung atau pernah mengalami serangan jantung', 1),
    (3, 'Tidak pernah merokok sebanyak itu / tidak pernah sama sekali', 0),
    (3, 'Dulu saya perokok (habis lebih dari 5 bungkus), tapi sekarang sudah total berhenti', 1),
    (3, 'Ya, saya masih aktif merokok sampai saat ini', 1),
    (4, 'Tidak pernah mengonsumsi alkohol sama sekali', 0),
    (4, 'Jarang / Masih dalam batas wajar sosial harian', 0),
    (4, 'Cukup sering / Berat (Pria: >= 15 gelas/minggu, Wanita: >= 8 gelas/minggu)', 1),
    (5, 'Ya, saya rutin meluangkan waktu untuk aktivitas fisik / olahraga', 1),
    (5, 'Hanya kadang-kadang saja kalau sempat dalam sebulan terakhir', 1),
    (5, 'Tidak sempat sama sekali, aktivitas saya kebanyakan duduk atau rebahan', 0),
    (6, 'Rutin mengonsumsi buah minimal 1 porsi atau lebih setiap hari', 1),
    (6, 'Cukup sering, sekitar 3-5 hari dalam seminggu', 0),
    (6, 'Jarang sekali / hampir tidak pernah makan buah', 0),
    (7, 'Ya, selalu ada porsi sayur di menu makan saya setiap hari', 1),
    (7, 'Kadang-kadang ada sayur, tidak rutin setiap hari', 0),
    (7, 'Saya tidak suka dan hampir tidak pernah makan sayur', 0),
    (8, 'Tidak pernah, saya selalu bisa berobat jika tubuh merasa sakit', 0),
    (8, 'Pernah menunda, tapi karena kesibukan kerja (bukan karena uang)', 0),
    (8, 'Ya, saya sering terpaksa menahan rasa sakit karena faktor biaya', 1),
    (9, 'Tidak ada masalah, kondisi kaki dan sendi saya normal/prima', 0),
    (9, 'Hanya merasa pegal biasa jika kelelahan beraktivitas', 0),
    (9, 'Ya, terasa sakit kronis dan butuh usaha ekstra untuk berjalan/naik tangga', 1),
    (10, 'Tidak pernah merasa stres sama sekali (0 hari)', 0),
    (10, 'Jarang (Hanya sekitar 1-5 hari dalam sebulan)', 3),
    (10, 'Lumayan sering terganggu (Total sekitar 6-15 hari)', 10),
    (10, 'Stres berat hampir setiap hari (Lebih dari 15 hari)', 25),
    (11, 'Tubuh saya selalu fit dan bugar sepanjang bulan (0 hari)', 0),
    (11, 'Hanya 1-5 hari terganggu karena sakit ringan (demam/pusing singkat)', 3),
    (11, 'Lumayan terganggu (Total sekitar 6-15 hari tumbang akibat sakit)', 10),
    (11, 'Sakit parah menahun / terkapar hampir sebulan penuh (>15 hari)', 25);
  `);
};

export const down = (pgm) => {
  // Kosongkan tabel secara otomatis saat migrate down dijalankan
  pgm.sql("TRUNCATE TABLE assessment_options CASCADE;");
  pgm.sql("TRUNCATE TABLE assessment_questions CASCADE;");
};