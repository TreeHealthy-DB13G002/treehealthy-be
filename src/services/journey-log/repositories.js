import pool from '../../config/database.js';

class JourneyRepository {
  async getWeeklyEvaluations(userId) {
    const query = {
      text: 'SELECT * FROM weekly_evaluations WHERE user_id = $1 ORDER BY week_number ASC',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getEvaluationById(userId, cycleId) {
    const query = {
      text: 'SELECT * FROM weekly_evaluations WHERE id = $1 AND user_id = $2',
      values: [cycleId, userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async updateLateEvaluation(userId, cycleId, { reflection, satisfactionRating, insight }) {
    const query = {
      text: `UPDATE weekly_evaluations 
             SET weekly_reflection = $3, physical_rating = $4, ai_weekly_insight = $5, created_at = NOW() 
             WHERE id = $1 AND user_id = $2 RETURNING *`,
      values: [cycleId, userId, reflection, satisfactionRating, insight],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }
}

export default new JourneyRepository();