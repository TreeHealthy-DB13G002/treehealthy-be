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
  // 1. Membuat Tipe ENUM Kustom
  pgm.createType('activity_type', ['working', 'not_working', 'freelance', 'household', 'student', 'retired']);
  pgm.createType('gender_type', ['male', 'female']);
  pgm.createType('program_status', ['active', 'completed', 'maintenance']);
  pgm.createType('tree_status_type', ['healthy', 'sick', 'dead']);
  pgm.createType('task_status', ['pending', 'completed']);
  pgm.createType('category_type', ['tensi', 'gula_darah', 'fisik_stress']);

  // 2. Tabel Users
  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    fullname: { type: 'varchar(255)', notNull: true },
    username: { type: 'varchar(100)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(50)', default: 'user' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 3. Tabel Users Profiles
  pgm.createTable('users_profiles', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    activities: { type: 'activity_type', notNull: true },
    age: { type: 'integer', notNull: true }, // Menggunakan skala 1 - 13
    gender: { type: 'gender_type', notNull: true },
    height: { type: 'float', notNull: true },
    weight: { type: 'float', notNull: true },
  });

  // 4. Tabel Diseases
  pgm.createTable('diseases', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true, unique: true },
  });

  // 5. Tabel User Family Diseases (Riwayat PTM Keluarga)
  pgm.createTable('user_family_diseases', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
    },
    disease_id: {
      type: 'integer',
      references: '"diseases"',
      onDelete: 'RESTRICT',
    },
  });

  // 6. Tabel Assessment Questions
  pgm.createTable('assessment_questions', {
    id: { type: 'serial', primaryKey: true },
    question_text: { type: 'text', notNull: true },
    category: { type: 'category_type', notNull: true },
  });

  // 7. Tabel Assessment Options
  pgm.createTable('assessment_options', {
    id: { type: 'serial', primaryKey: true },
    question_id: {
      type: 'integer',
      references: '"assessment_questions"',
      onDelete: 'CASCADE',
    },
    option_text: { type: 'text', notNull: true },
    score_weight: { type: 'integer', notNull: true },
  });

  // 8. Tabel User Assessment Responses
  pgm.createTable('user_assessment_responses', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
    },
    question_id: {
      type: 'integer',
      references: '"assessment_questions"',
      onDelete: 'CASCADE',
    },
    option_id: {
      type: 'integer',
      references: '"assessment_options"',
      onDelete: 'CASCADE',
    },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 9. Tabel Assessment Results
  pgm.createTable('assessment_results', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
    },
    total_risk_score: { type: 'integer', notNull: true },
    score_tensi: { type: 'integer', notNull: true },
    score_gula_darah: { type: 'integer', notNull: true },
    score_fisik_stress: { type: 'integer', notNull: true },
    ai_explainer_text: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 10. Tabel User Programs
  pgm.createTable('user_programs', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
    },
    assessment_result_id: {
      type: 'integer',
      references: '"assessment_results"',
      onDelete: 'SET NULL',
    },
    current_week: { type: 'integer', default: 1 },
    current_day: { type: 'integer', default: 0 },
    streak_days: { type: 'integer', default: 0 },
    status: { type: 'program_status', default: 'active' },
    start_date: { type: 'date', notNull: true, default: pgm.func('current_date') },
    maintenance_countdown_days: { type: 'integer' },
    next_assessment_date: { type: 'date' },
  });

  // 11. Tabel User Trees
  pgm.createTable('user_trees', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      unique: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    tree_status: { type: 'tree_status_type', default: 'healthy' },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 12. Tabel Daily Action Plans
  pgm.createTable('daily_action_plans', {
    id: { type: 'serial', primaryKey: true },
    assigned_week: { type: 'integer', notNull: true },
    assigned_day: { type: 'integer', notNull: true },
    task_title: { type: 'varchar(255)', notNull: true },
    task_description: { type: 'text' },
    unlock_time: { type: 'time' },
    lock_time: { type: 'time' },
  });

  // 13. Tabel User Task Trackers
  pgm.createTable('user_task_trackers', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
    },
    action_plan_id: {
      type: 'integer',
      references: '"daily_action_plans"',
      onDelete: 'CASCADE',
    },
    status: { type: 'task_status', default: 'pending' },
    log_date: { type: 'date', notNull: true, default: pgm.func('current_date') },
  });

  // 14. Tabel Weekly Evaluations
  pgm.createTable('weekly_evaluations', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
    },
    week_number: { type: 'integer', notNull: true },
    avg_compliance: { type: 'integer' },
    perfect_days: { type: 'integer' },
    risk_drop_percentage: { type: 'integer' },
    physical_rating: { type: 'integer' },
    weekly_reflection: { type: 'text' },
    ai_weekly_insight: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
   // Drop tables in reverse order to respect foreign key constraints
  pgm.dropTable('weekly_evaluations');
  pgm.dropTable('user_task_trackers');
  pgm.dropTable('daily_action_plans');
  pgm.dropTable('user_trees');
  pgm.dropTable('user_programs');
  pgm.dropTable('assessment_results');
  pgm.dropTable('user_assessment_responses');
  pgm.dropTable('assessment_options');
  pgm.dropTable('assessment_questions');
  pgm.dropTable('user_family_diseases');
  pgm.dropTable('diseases');
  pgm.dropTable('users_profiles');
  pgm.dropTable('users');

  // Drop custom ENUM types
  pgm.dropType('category_type');
  pgm.dropType('task_status');
  pgm.dropType('tree_status_type');
  pgm.dropType('program_status');
  pgm.dropType('gender_type');
  pgm.dropType('activity_type');
};
