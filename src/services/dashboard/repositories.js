import pool from '../../config/database.js';

class DashboardRepository {
  async getActiveProgram(userId) {
    const query = {
      text: 'SELECT * FROM user_programs WHERE user_id = $1 AND status = \'active\'',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async createDefaultProgram(userId, assessmentResultId) {
    const query = {
      text: `INSERT INTO user_programs (user_id, assessment_result_id, current_week, current_day, streak_days, status, start_date) 
             VALUES ($1, $2, 1, 1, 0, 'active', CURRENT_DATE) RETURNING *`,
      values: [userId, assessmentResultId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getLatestAssessmentResult(userId) {
    const query = {
      text: 'SELECT * FROM assessment_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getTreeStatus(userId) {
    const query = {
      text: 'SELECT * FROM user_trees WHERE user_id = $1',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async upsertTreeStatus(userId, status) {
    const checkQuery = {
      text: 'SELECT id FROM user_trees WHERE user_id = $1',
      values: [userId],
    };
    const checkRes = await pool.query(checkQuery);

    if (checkRes.rows.length > 0) {
      const query = {
        text: 'UPDATE user_trees SET tree_status = $2, updated_at = NOW() WHERE user_id = $1 RETURNING *',
        values: [userId, status],
      };
      const result = await pool.query(query);
      return result.rows[0];
    } else {
      const query = {
        text: 'INSERT INTO user_trees (user_id, tree_status) VALUES ($1, $2) RETURNING *',
        values: [userId, status],
      };
      const result = await pool.query(query);
      return result.rows[0];
    }
  }

  async getDailyTasks(week, day) {
    const query = {
      text: 'SELECT * FROM daily_action_plans WHERE assigned_week = $1 AND assigned_day = $2',
      values: [week, day],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getOrCreateTaskTrackers(userId, week, day) {
    const checkQuery = {
      // KOREKSI: Wajib menyaring berdasarkan log_date DAN assigned_week agar tidak terjadi carry-over dari minggu lalu
      text: `SELECT utt.id, utt.status, dap.task_title, dap.task_description 
             FROM user_task_trackers utt
             JOIN daily_action_plans dap ON utt.action_plan_id = dap.id
             WHERE utt.user_id = $1 AND utt.log_date = CURRENT_DATE AND dap.assigned_week = $2`,
      values: [userId, week],
    };
    const checkRes = await pool.query(checkQuery);

    if (checkRes.rows.length > 0) {
      return checkRes.rows;
    }

    let plans = await this.getDailyTasks(week, day);
    
    if (plans.length === 0) {
      const defaultTasks = [
        { assigned_week: week, assigned_day: day, task_title: 'Kualitas Tidur Semalam', task_description: 'Tidur minimal 7-8 jam per hari.' },
        { assigned_week: week, assigned_day: day, task_title: 'Hidrasi Air Putih (Target 2L)', task_description: 'Minum minimal 8 gelas air putih.' },
        { assigned_week: week, assigned_day: day, task_title: 'Jeda Mental & Micro-Break', task_description: 'Lakukan perenggangan fisik singkat setiap 2 jam bekerja.' },
        { assigned_week: week, assigned_day: day, task_title: 'Validasi: Bebas Gorengan & Makanan Asin', task_description: 'Hindari konsumsi lemak jenuh dan tinggi natrium.' },
      ];

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const doubleCheck = await client.query('SELECT id FROM daily_action_plans WHERE assigned_week = $1 AND assigned_day = $2', [week, day]);
        
        if (doubleCheck.rows.length === 0) {
          for (const t of defaultTasks) {
            const insertPlan = await client.query(
              'INSERT INTO daily_action_plans (assigned_week, assigned_day, task_title, task_description) VALUES ($1, $2, $3, $4) RETURNING id',
              [t.assigned_week, t.assigned_day, t.task_title, t.task_description]
            );
            await client.query(
              `INSERT INTO user_task_trackers (user_id, action_plan_id, status, log_date) 
               VALUES ($1, $2, 'pending', CURRENT_DATE)
               ON CONFLICT (user_id, action_plan_id, log_date) DO NOTHING`,
              [userId, insertPlan.rows[0].id]
            );
          }
        } else {
          for (const plan of doubleCheck.rows) {
            await client.query(
              `INSERT INTO user_task_trackers (user_id, action_plan_id, status, log_date) 
               VALUES ($1, $2, 'pending', CURRENT_DATE)
               ON CONFLICT (user_id, action_plan_id, log_date) DO NOTHING`,
              [userId, plan.id]
            );
          }
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      for (const plan of plans) {
        await pool.query(
          `INSERT INTO user_task_trackers (user_id, action_plan_id, status, log_date) 
           VALUES ($1, $2, 'pending', CURRENT_DATE)
           ON CONFLICT (user_id, action_plan_id, log_date) DO NOTHING`,
          [userId, plan.id]
        );
      }
    }

    const finalRes = await pool.query(checkQuery, [userId, week]);
    return finalRes.rows;
  }

  async toggleTaskStatus(userId, taskId) {
    const checkQuery = {
      text: 'SELECT status FROM user_task_trackers WHERE id = $1 AND user_id = $2',
      values: [taskId, userId],
    };
    const checkRes = await pool.query(checkQuery);

    if (checkRes.rows.length === 0) return null;

    const nextStatus = checkRes.rows[0].status === 'completed' ? 'pending' : 'completed';

    const query = {
      text: 'UPDATE user_task_trackers SET status = $3 WHERE id = $1 AND user_id = $2 RETURNING *',
      values: [taskId, userId, nextStatus],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getTodayCompliance(userId) {
    const query = {
      text: 'SELECT COUNT(*) as total, SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed FROM user_task_trackers WHERE user_id = $1 AND log_date = CURRENT_DATE',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async updateProgramProgress(userId, programId, { currentDay, streakDays, status }) {
    const query = {
      text: 'UPDATE user_programs SET current_day = $2, streak_days = $3, status = $4 WHERE id = $1 AND user_id = $5 RETURNING *',
      values: [programId, currentDay, streakDays, status, userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  // KUNCI PERBAIKAN: Fungsi atomik baru untuk menyelesaikan siklus mingguan (week + 1 dan day = 1 sekaligus)
  async completeWeeklyCycle(userId, programId, nextWeekNumber) {
    const query = {
      text: `UPDATE user_programs 
             SET current_week = $2, current_day = 1, streak_days = 0, status = 'active', start_date = CURRENT_DATE 
             WHERE id = $1 AND user_id = $3 RETURNING *`,
      values: [programId, nextWeekNumber, userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async saveWeeklyEvaluation(userId, { weekNumber, perfectDays, avgCompliance, reflection, insight }) {
    const query = {
      text: `INSERT INTO weekly_evaluations (user_id, week_number, perfect_days, avg_compliance, weekly_reflection, ai_weekly_insight, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      values: [userId, weekNumber, perfectDays, avgCompliance, reflection, insight],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getWeeklyTrackers(userId, weekNumber) {
    const query = {
      text: `SELECT utt.status, dap.assigned_day, utt.log_date 
             FROM user_task_trackers utt
             JOIN daily_action_plans dap ON utt.action_plan_id = dap.id
             WHERE utt.user_id = $1 AND dap.assigned_week = $2`,
      values: [userId, weekNumber],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getWeeklyStats(userId, weekNumber) {
    const trackers = await this.getWeeklyTrackers(userId, weekNumber);
    const total_tasks = trackers.length;
    const done_tasks = trackers.filter(t => t.status === 'completed').length;
    const avg_compliance = total_tasks > 0 ? Math.round((done_tasks / total_tasks) * 100) : 0;

    const daysMap = {};
    trackers.forEach(t => {
      const day = t.assigned_day;
      if (!daysMap[day]) {
        daysMap[day] = { total: 0, completed: 0 };
      }
      daysMap[day].total += 1;
      if (t.status === 'completed') {
        daysMap[day].completed += 1;
      }
    });

    let perfect_days = 0;
    Object.values(daysMap).forEach(d => {
      if (d.total > 0 && d.total === d.completed) {
        perfect_days += 1;
      }
    });

    return {
      avg_compliance,
      perfect_days,
      done_tasks,
      total_tasks
    };
  }
}

export default new DashboardRepository();