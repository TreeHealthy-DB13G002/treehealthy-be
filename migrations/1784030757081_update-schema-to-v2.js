/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // 1. Rename tabel user_assessment_responses menjadi user_assessment_response (singular)
  pgm.renameTable('user_assessment_responses', 'user_assessment_response');

  // 2. Rename kolom di tabel assessment_results sesuai ERD baru
  pgm.renameColumn('assessment_results', 'total_risk_score', 'final_risk_score');
  pgm.renameColumn('assessment_results', 'score_tensi', 'physical_health_score');
  pgm.renameColumn('assessment_results', 'score_gula_darah', 'lifestyle_score');
  pgm.renameColumn('assessment_results', 'score_fisik_stress', 'mental_score');

  // 3. Memperbarui ENUM activity_type menjadi huruf kecil secara aman di PostgreSQL
  // Langkah A: Ubah sementara tipe kolom di users_profiles menjadi VARCHAR
  pgm.alterColumn('users_profiles', 'activities', {
    type: 'varchar(50)',
    using: 'activities::varchar',
  });

  // Langkah B: Hapus tipe ENUM lama
  pgm.dropType('activity_type');

  // Langkah C: Buat tipe ENUM baru dengan huruf kecil semua
  pgm.createType('activity_type', [
    'working',
    'not_working',
    'freelance',
    'household',
    'student',
    'retired',
  ]);

  // Langkah D: Ubah data yang ada di kolom activities menjadi lowercase agar cocok dengan ENUM baru
  pgm.sql("UPDATE users_profiles SET activities = LOWER(activities)");

  // Langkah E: Kembalikan tipe kolom activities ke tipe ENUM activity_type
  pgm.alterColumn('users_profiles', 'activities', {
    type: 'activity_type',
    using: 'activities::activity_type',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Proses pembatalan (Down) mengembalikan ke kondisi migrasi pertama

  // 1. Kembalikan tipe kolom ke VARCHAR sementara
  pgm.alterColumn('users_profiles', 'activities', {
    type: 'varchar(50)',
    using: 'activities::varchar',
  });

  // 2. Drop tipe ENUM baru
  pgm.dropType('activity_type');

  // 3. Buat kembali tipe ENUM lama (dengan beberapa huruf kapital awal)
  pgm.createType('activity_type', [
    'working',
    'not_working',
    'Freelance',
    'Household',
    'Student',
    'Retired',
  ]);

  // 4. Ubah data kembali (contoh memformat ulang huruf pertama menjadi kapital)
  pgm.sql(`
    UPDATE users_profiles SET activities = 
    CASE 
      WHEN activities = 'freelance' THEN 'Freelance'
      WHEN activities = 'household' THEN 'Household'
      WHEN activities = 'student' THEN 'Student'
      WHEN activities = 'retired' THEN 'Retired'
      ELSE activities
    END
  `);

  // 5. Kembalikan tipe kolom ke ENUM lama
  pgm.alterColumn('users_profiles', 'activities', {
    type: 'activity_type',
    using: 'activities::activity_type',
  });

  // 6. Kembalikan nama kolom di tabel assessment_results ke versi awal
  pgm.renameColumn('assessment_results', 'final_risk_score', 'total_risk_score');
  pgm.renameColumn('assessment_results', 'physical_health_score', 'score_tensi');
  pgm.renameColumn('assessment_results', 'lifestyle_score', 'score_gula_darah');
  pgm.renameColumn('assessment_results', 'mental_score', 'score_fisik_stress');

  // 7. Kembalikan nama tabel user_assessment_response ke versi jamak
  pgm.renameTable('user_assessment_response', 'user_assessment_responses');
};
