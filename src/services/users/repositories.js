import pool from '../../config/database.js';

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
      text: 'SELECT * FROM users_profiles WHERE user_id = $1',
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async createOrUpdateProfile(userId, { activities, ageScale, genderString, height, weight }) {
    const checkQuery = {
      text: 'SELECT id FROM users_profiles WHERE user_id = $1',
      values: [userId],
    };
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      const updateQuery = {
        text: `UPDATE users_profiles 
               SET activities = $2, age = $3, gender = $4, height = $5, weight = $6 
               WHERE user_id = $1 RETURNING *`,
        values: [userId, activities, ageScale, genderString, height, weight],
      };
      const result = await pool.query(updateQuery);
      return result.rows[0];
    } else {
      const insertQuery = {
        text: `INSERT INTO users_profiles (user_id, activities, age, gender, height, weight) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        values: [userId, activities, ageScale, genderString, height, weight],
      };
      const result = await pool.query(insertQuery);
      return result.rows[0];
    }
  }

  async replaceFamilyDiseases(userId, diseaseNames) {
    // Jalankan operasi dalam transaksi database demi konsistensi data
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Hapus riwayat penyakit terdahulu
      await client.query('DELETE FROM user_family_diseases WHERE user_id = $1', [userId]);

      if (diseaseNames.length > 0) {
        for (const diseaseName of diseaseNames) {
          // Cari ID penyakit berdasarkan nama (opsional: pastikan data master penyakit sudah terisi)
          let diseaseRes = await client.query('SELECT id FROM diseases WHERE name = $1', [diseaseName]);
          
          let diseaseId;
          if (diseaseRes.rows.length === 0) {
            // Jika data master penyakit belum ada, buat baru secara otomatis
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
    return result.map((row) => row.name);
  }
}

export default new UserRepository();