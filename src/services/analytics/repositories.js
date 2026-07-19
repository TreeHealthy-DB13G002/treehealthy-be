import pool from '../../config/database.js';

class AnalyticsRepository {
  async getRiskHistory(userId) {
    const query = {
      text: `SELECT final_risk_score, created_at FROM assessment_results 
             WHERE user_id = $1 ORDER BY created_at ASC`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getTaskCompliance(userId) {
    const query = {
      text: `SELECT log_date, COUNT(*) as total, 
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed 
             FROM user_task_trackers WHERE user_id = $1 
             GROUP BY log_date ORDER BY log_date ASC`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }
}

export default new AnalyticsRepository();