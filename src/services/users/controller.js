import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserRepository from './repositories.js';
import { registerSchema, loginSchema, assessmentSchema, profileUpdateSchema } from './validator.js';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import AuthenticationError from '../../exceptions/AuthenticationError.js';

import { convertAgeToScale, evaluateHealthRisk } from './healthCalculator.js';

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

  // 1. Submit Assessment Endpoint
  async submitAssessment(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = assessmentSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { age, height, weight, gender, activities, family_diseases } = value;
      const genderString = gender === 1 ? 'male' : 'female';

      // Simpan data fisik dasar ke database (menyimpan usia riil 'age')
      await UserRepository.createOrUpdateProfile(userId, {
        activities,
        age, // Usia asli (misal: 20)
        genderString,
        height,
        weight,
      });

      await UserRepository.replaceFamilyDiseases(userId, family_diseases);

      // Jalankan evaluasi medis
      const healthAnalysis = evaluateHealthRisk({
        weight,
        height,
        age,
        activities,
        familyDiseases: family_diseases,
      });

      const aiExplainerText = `Berdasarkan BMI Anda (${healthAnalysis.bmi}), Anda berada dalam kategori ${healthAnalysis.classification}. Efek risiko: ${healthAnalysis.riskEffect}.`;

      await UserRepository.upsertAssessmentResult(userId, {
        finalRiskScore: healthAnalysis.finalRiskScore,
        physicalHealthScore: healthAnalysis.physicalHealthScore,
        lifestyleScore: healthAnalysis.lifestyleScore,
        mentalScore: healthAnalysis.mentalScore,
        aiExplainerText,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Hasil penilaian risiko berhasil dihitung.',
        data: {
          bmi: healthAnalysis.bmi,
          classification: healthAnalysis.classification,
          risk_effect: healthAnalysis.riskEffect,
          scores: {
            physical_health_score: healthAnalysis.physicalHealthScore,
            lifestyle_score: healthAnalysis.lifestyleScore,
            mental_score: healthAnalysis.mentalScore,
            final_risk_score: healthAnalysis.finalRiskScore,
          },
          ai_explainer_text: aiExplainerText,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. Ambil Profil Lengkap Pengguna (Untuk render halaman Profile)
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const fullProfile = await UserRepository.getCompleteUserProfile(userId);

      if (!fullProfile) {
        throw new NotFoundError('Pengguna tidak ditemukan.');
      }

      return res.status(200).json({
        status: 'success',
        data: {
          fullname: fullProfile.user.fullname,
          username: fullProfile.user.username,
          profile: fullProfile.profile ? {
            age: fullProfile.profile.age, // Mengembalikan umur asli
            height: fullProfile.profile.height,
            weight: fullProfile.profile.weight,
            gender: fullProfile.profile.gender === 'male' ? 1 : 0,
            activities: fullProfile.profile.activities,
          } : null,
          family_diseases: fullProfile.familyDiseases,
          health_analysis: fullProfile.assessmentResult ? {
            physical_health_score: fullProfile.assessmentResult.physical_health_score,
            lifestyle_score: fullProfile.assessmentResult.lifestyle_score,
            mental_score: fullProfile.assessmentResult.mental_score,
            final_risk_score: fullProfile.assessmentResult.final_risk_score,
            ai_explainer_text: fullProfile.assessmentResult.ai_explainer_text,
          } : null,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. Update Profile Lengkap (Memperbarui data dasar + data fisik seketika)
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = profileUpdateSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { fullname, username, age, height, weight, gender, activities, family_diseases } = value;
      const genderString = gender === 1 ? 'male' : 'female';

      // Perbarui tabel users dasar
      const updatedUser = await UserRepository.updateBasicUserInfo(userId, fullname, username);

      // Perbarui tabel users_profiles
      const updatedProfile = await UserRepository.createOrUpdateProfile(userId, {
        activities,
        age,
        genderString,
        height,
        weight,
      });

      await UserRepository.replaceFamilyDiseases(userId, family_diseases);

      // Jalankan ulang penghitungan medis dengan parameter baru
      const healthAnalysis = evaluateHealthRisk({
        weight,
        height,
        age,
        activities,
        familyDiseases: family_diseases,
      });

      const aiExplainerText = `Berdasarkan BMI Anda (${healthAnalysis.bmi}), Anda berada dalam kategori ${healthAnalysis.classification}. Efek risiko: ${healthAnalysis.riskEffect}.`;

      await UserRepository.upsertAssessmentResult(userId, {
        finalRiskScore: healthAnalysis.finalRiskScore,
        physicalHealthScore: healthAnalysis.physicalHealthScore,
        lifestyleScore: healthAnalysis.lifestyleScore,
        mentalScore: healthAnalysis.mentalScore,
        aiExplainerText,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Profil kesehatan berhasil diperbarui.',
        data: {
          fullname: updatedUser.fullname,
          username: updatedUser.username,
          profile: {
            age: updatedProfile.age,
            height: updatedProfile.height,
            weight: updatedProfile.weight,
            gender: updatedProfile.gender === 'male' ? 1 : 0,
            activities: updatedProfile.activities,
          },
          health_analysis: {
            bmi: healthAnalysis.bmi,
            classification: healthAnalysis.classification,
            risk_effect: healthAnalysis.riskEffect,
            scores: {
              physical_health_score: healthAnalysis.physicalHealthScore,
              lifestyle_score: healthAnalysis.lifestyleScore,
              mental_score: healthAnalysis.mentalScore,
              final_risk_score: healthAnalysis.finalRiskScore,
            },
            ai_explainer_text: aiExplainerText,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();