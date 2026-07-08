import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserRepository from './repositories.js';
import { registerSchema, loginSchema, profileSchema } from './validator.js';
import InvariantError from '../../exceptions/InvariantError.js';
import AuthenticationError from '../../exceptions/AuthenticationError.js';

// Fungsi bantu untuk mengubah rentang usia asli ke dalam Skala 1 - 13
const convertAgeToScale = (age) => {
  if (age >= 18 && age <= 24) return 1;
  if (age >= 25 && age <= 29) return 2;
  if (age >= 30 && age <= 34) return 3;
  if (age >= 35 && age <= 39) return 4;
  if (age >= 40 && age <= 44) return 5;
  if (age >= 45 && age <= 49) return 6;
  if (age >= 50 && age <= 54) return 7;
  if (age >= 55 && age <= 59) return 8;
  if (age >= 60 && age <= 64) return 9;
  if (age >= 65 && age <= 69) return 10;
  if (age >= 70 && age <= 74) return 11;
  if (age >= 75 && age <= 79) return 12;
  if (age >= 80) return 13;
  throw new InvariantError('Usia di bawah batas minimum (18 tahun).');
};

// Fungsi bantu untuk kalkulasi BMI
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return parseFloat(bmi.toFixed(1));
};

// Klasifikasi status medis dan efek risiko diabetes
const getBMIMedicalStatus = (bmi) => {
  if (bmi < 18.5) {
    return {
      classification: 'Berat Badan Kurang (Underweight)',
      riskEffect: 'Rendah, tapi rentang imun turun',
    };
  }
  if (bmi >= 18.5 && bmi <= 22.9) {
    return {
      classification: 'Berat Badan Ideal (Normal)',
      riskEffect: 'Aman / Risiko Dasar',
    };
  }
  if (bmi >= 23.0 && bmi <= 24.9) {
    return {
      classification: 'Kelebihan Berat Badan (Overweight)',
      riskEffect: 'Waspada (Resistensi insulin mulai naik)',
    };
  }
  if (bmi >= 25.0 && bmi <= 29.9) {
    return {
      classification: 'Obesitas Tingkat I (Obese I)',
      riskEffect: 'Tinggi (Pemicu utama diabetes tipe 2)',
    };
  }
  return {
    classification: 'Obesitas Tingkat II (Obese II)',
    riskEffect: 'Sangat Tinggi / Kronis',
  };
};

class UserController {
  async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { fullname, username, password } = value;

      const userExists = await UserRepository.findUserByUsername(username);
      if (userExists) {
        throw new InvariantError('Username sudah terdaftar.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await UserRepository.createUser(fullname, username, hashedPassword);

      return res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil.',
        data: {
          userId: newUser.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { username, password } = value;
      const user = await UserRepository.findUserByUsername(username);

      if (!user) {
        throw new AuthenticationError('Kredensial yang Anda berikan salah.');
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new AuthenticationError('Kredensial yang Anda berikan salah.');
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.ACCESS_TOKEN_KEY,
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        status: 'success',
        message: 'Login berhasil.',
        data: {
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = profileSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { activities, age, gender, height, weight, family_diseases } = value;

      // 1. Konversi data sesuai kebutuhan tabel medis dan database
      const ageScale = convertAgeToScale(age);
      const genderString = gender === 1 ? 'male' : 'female';

      // 2. Simpan atau perbarui profil data fisik ke DB
      const updatedProfile = await UserRepository.createOrUpdateProfile(userId, {
        activities,
        ageScale,
        genderString,
        height,
        weight,
      });

      // 3. Simpan relasi penyakit bawaan keluarga
      await UserRepository.replaceFamilyDiseases(userId, family_diseases);

      // 4. Kalkulasi hasil evaluasi instan untuk respon
      const bmiValue = calculateBMI(weight, height);
      const bmiMedResult = getBMIMedicalStatus(bmiValue);

      return res.status(200).json({
        status: 'success',
        message: 'Profil kesehatan berhasil diperbarui.',
        data: {
          profile: {
            id: updatedProfile.id,
            activities: updatedProfile.activities,
            age_scale: updatedProfile.age,
            gender: updatedProfile.gender,
            height: updatedProfile.height,
            weight: updatedProfile.weight,
          },
          health_analysis: {
            bmi: bmiValue,
            classification: bmiMedResult.classification,
            risk_effect: bmiMedResult.riskEffect,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();