import pool from '../../config/database.js';
import InvariantError from '../../exceptions/InvariantError.js';

class UserRepository {
  async findUserByUsername(username) {
    const query = {
      text: 'SELECT * FROM users WHERE username = $1',
      values: [username],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async createUser(fullname, username, hashedPassword) {
    const query = {
      text: 'INSERT INTO users (fullname, username, password) VALUES ($1, $2, $3) RETURNING id, fullname, username',
      values: [fullname, username, hashedPassword],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async findProfileByUserId(userId) {
    const query = {
      text: 'SELECT id FROM users_profiles WHERE user_id = $1',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async createOrUpdateProfile(userId, { activities, age, genderString, height, weight }) {
    const checkQuery = {
      text: 'SELECT id FROM users_profiles WHERE user_id = $1',
      values: [userId],
    };
    const checkResult = await pool.query(checkQuery);

    let result;
    if (checkResult.rows.length > 0) {
      const updateQuery = {
        text: `UPDATE users_profiles 
               SET activities = $2, age = $3, gender = $4, height = $5, weight = $6 
               WHERE user_id = $1 RETURNING *`,
        values: [userId, activities, age, genderString, height, weight],
      };
      const res = await pool.query(updateQuery);
      result = res.rows[0];
    } else {
      const insertQuery = {
        text: `INSERT INTO users_profiles (user_id, activities, age, gender, height, weight) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        values: [userId, activities, age, genderString, height, weight],
      };
      const res = await pool.query(insertQuery);
      result = res.rows[0];
    }
    return result;
  }

  async updateBasicUserInfo(userId, fullname, username) {
    try {
      const query = {
        text: 'UPDATE users SET fullname = $1, username = $2, updated_at = NOW() WHERE id = $3 RETURNING fullname, username',
        values: [fullname, username, userId],
      };
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new InvariantError('Username sudah digunakan oleh pengguna lain.');
      }
      throw error;
    }
  }

  async replaceFamilyDiseases(userId, diseaseNames) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_family_diseases WHERE user_id = $1', [userId]);

      if (diseaseNames.length > 0) {
        for (const diseaseName of diseaseNames) {
          let diseaseRes = await client.query('SELECT id FROM diseases WHERE name = $1', [diseaseName]);
          
          let diseaseId;
          if (diseaseRes.rows.length === 0) {
            const insertDisease = await client.query('INSERT INTO diseases (name) VALUES ($1) RETURNING id', [diseaseName]);
            diseaseId = insertDisease.rows[0].id;
          } else {
            diseaseId = diseaseRes.rows[0].id;
          }

          await client.query('INSERT INTO user_family_diseases (user_id, disease_id) VALUES ($1, $2)', [userId, diseaseId]);
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getFamilyDiseases(userId) {
    const query = {
      text: `SELECT d.name FROM user_family_diseases ufd 
             JOIN diseases d ON ufd.disease_id = d.id 
             WHERE ufd.user_id = $1`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows.map((row) => row.name);
  }

  async getCompleteUserProfile(userId) {
    const userQuery = {
      text: 'SELECT id, fullname, username FROM users WHERE id = $1',
      values: [userId],
    };
    const userRes = await pool.query(userQuery);
    const user = userRes.rows[0];

    if (!user) return null;

    const profileQuery = {
      text: 'SELECT activities, age, gender, height, weight FROM users_profiles WHERE user_id = $1',
      values: [userId],
    };
    const profileRes = await pool.query(profileQuery);
    const profile = profileRes.rows[0] || null;

    const resultQuery = {
      text: 'SELECT final_risk_score, physical_health_score, lifestyle_score, mental_score, ai_explainer_text FROM assessment_results WHERE user_id = $1',
      values: [userId],
    };
    const resultRes = await pool.query(resultQuery);
    const assessmentResult = resultRes.rows[0] || null;

    const familyDiseases = await this.getFamilyDiseases(userId);

    return {
      user,
      profile,
      familyDiseases,
      assessmentResult,
    };
  }
}

export default new UserRepository();