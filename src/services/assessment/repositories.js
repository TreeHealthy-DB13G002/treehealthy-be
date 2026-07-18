import pool from '../../config/database.js';

class AssessmentRepository {
  async saveProfile(userId, { age, gender, height, weight, activityLevel }) {
    const checkQuery = {
      text: 'SELECT id FROM users_profiles WHERE user_id = $1',
      values: [userId],
    };
    const checkRes = await pool.query(checkQuery);

    const genderString = gender === 1 ? 'male' : 'female';

    if (checkRes.rows.length > 0) {
      const query = {
        text: `UPDATE users_profiles 
               SET age = $2, gender = $3, height = $4, weight = $5, activities = $6 
               WHERE user_id = $1 RETURNING *`,
        values: [userId, age, genderString, height, weight, activityLevel],
      };
      const res = await pool.query(query);
      return res.rows[0];
    } else {
      const query = {
        text: `INSERT INTO users_profiles (user_id, age, gender, height, weight, activities) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        values: [userId, age, genderString, height, weight, activityLevel],
      };
      const res = await pool.query(query);
      return res.rows[0];
    }
  }

  // Mendapatkan pertanyaan dari tabel database (assessment_questions & assessment_options)
  async getQuestions() {
    const query = `
      SELECT q.id as question_id, q.question_text, q.category,
             o.id as option_id, o.option_text, o.score_weight
      FROM assessment_questions q
      JOIN assessment_options o ON q.id = o.question_id
      ORDER BY q.id, o.id
    `;
    const result = await pool.query(query);
    
    // Strukturkan hasil query agar opsi berada di dalam objek pertanyaan masing-masing
    const questionsMap = {};
    result.rows.forEach((row) => {
      if (!questionsMap[row.question_id]) {
        questionsMap[row.question_id] = {
          id: row.question_id,
          question_text: row.question_text,
          category: row.category,
          options: [],
        };
      }
      questionsMap[row.question_id].options.push({
        id: row.option_id,
        option_text: row.option_text,
        score_weight: row.score_weight,
      });
    });

    return Object.values(questionsMap);
  }

  async saveAssessmentResult(userId, { finalRiskScore, physicalHealthScore, lifestyleScore, mentalScore, aiExplainerText }) {
    const checkQuery = {
      text: 'SELECT id FROM assessment_results WHERE user_id = $1',
      values: [userId],
    };
    const checkRes = await pool.query(checkQuery);

    if (checkRes.rows.length > 0) {
      const query = {
        text: `UPDATE assessment_results 
               SET final_risk_score = $2, physical_health_score = $3, lifestyle_score = $4, mental_score = $5, ai_explainer_text = $6, created_at = NOW() 
               WHERE user_id = $1 RETURNING *`,
        values: [userId, finalRiskScore, physicalHealthScore, lifestyleScore, mentalScore, aiExplainerText],
      };
      await pool.query(query);
    } else {
      const query = {
        text: `INSERT INTO assessment_results (user_id, final_risk_score, physical_health_score, lifestyle_score, mental_score, ai_explainer_text) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        values: [userId, finalRiskScore, physicalHealthScore, lifestyleScore, mentalScore, aiExplainerText],
      };
      await pool.query(query);
    }
  }
}

export default new AssessmentRepository();