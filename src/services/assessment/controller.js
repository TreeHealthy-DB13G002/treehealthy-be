import Joi from 'joi';
import pool from '../../config/database.js';
import AssessmentRepository from './repositories.js';
import UserRepository from '../auth/repositories.js';
import DashboardRepository from '../dashboard/repositories.js';
import AIService from './aiService.js'; 
import InvariantError from '../../exceptions/InvariantError.js';
import { convertAgeToScale, evaluateHealthRisk } from './healthCalculator.js';

export const assessmentProfileSchema = Joi.object({
  age: Joi.number().integer().min(18).max(120).required(),
  gender: Joi.number().valid(0, 1).required(),
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  activity_level: Joi.string().valid('working', 'not_working', 'freelance', 'household', 'student', 'retired').required(),
  family_history: Joi.array().items(Joi.string().valid('hypertension', 'diabetes', 'heart_disease')).default([]),
});

class AssessmentController {
  async saveProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = assessmentProfileSchema.validate(req.body);
      if (error) throw new InvariantError(error.details[0].message);

      const { age, gender, height, weight, activity_level, family_history } = value;

      await AssessmentRepository.saveProfile(userId, { age, gender, height, weight, activityLevel: activity_level });

      const mappedDiseases = family_history.map(d => {
        if (d === 'hypertension') return 'hipertensi';
        if (d === 'heart_disease') return 'jantung/kronis';
        return d;
      });
      await UserRepository.replaceFamilyDiseases(userId, mappedDiseases);

      return res.status(200).json({
        status: 'success',
        message: 'Data medis awal berhasil disimpan.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getQuestions(req, res, next) {
    try {
      const dbInfo = await pool.query('SELECT CURRENT_USER, CURRENT_DATABASE(), VERSION()');
      console.log(`\n[Diagnostic] Node.js terhubung sebagai User: "${dbInfo.rows[0].current_user}" pada Database: "${dbInfo.rows[0].current_database}"`);
      
      const qCount = await pool.query('SELECT COUNT(*) FROM assessment_questions');
      console.log(`[Diagnostic] Jumlah baris ditemukan di tabel assessment_questions: ${qCount.rows[0].count}`);
      
      const oCount = await pool.query('SELECT COUNT(*) FROM assessment_options');
      console.log(`[Diagnostic] Jumlah baris ditemukan di tabel assessment_options: ${oCount.rows[0].count}\n`);

      const questions = await AssessmentRepository.getQuestions();
      console.log(`[Database Log] Jumlah pertanyaan yang berhasil ditarik: ${questions.length} baris.`);

      return res.status(200).json({
        status: 'success',
        data: questions,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAssessment(req, res, next) {
    try {
      const userId = req.user.id;
      const { answers } = req.body; 

      if (!Array.isArray(answers) || answers.length < 11) {
        throw new InvariantError('Jawaban kuesioner tidak lengkap.');
      }

      const fullProfile = await UserRepository.getCompleteUserProfile(userId);
      const userProfile = {
        fullname: fullProfile.user.fullname,
        age: fullProfile.profile.age,
        gender: fullProfile.profile.gender,
        height: fullProfile.profile.height,
        weight: fullProfile.profile.weight,
        activities: fullProfile.profile.activities,
      };

      // Jalankan kuesioner lokal cadangan terlebih dahulu untuk menyuplai skor pilar dinamis (Guna menghindari skor hardcode)
      const localAnalysis = evaluateHealthRisk({
        weight: userProfile.weight,
        height: userProfile.height,
        age: userProfile.age,
        activities: userProfile.activities,
        familyDiseases: fullProfile.familyDiseases,
      });

      // Hubungi AI Engine FastAPI
      const aiResult = await AIService.getAiRiskAnalysis(userProfile, answers);

      let finalRiskScore, physicalHealthScore, lifestyleScore, mentalScore, aiExplainerText;

      // Suplay 3 skor pilar secara dinamis dari logika kuesioner lokal (tidak lagi hardcode)
      physicalHealthScore = localAnalysis.physicalHealthScore;
      lifestyleScore = localAnalysis.lifestyleScore;
      mentalScore = localAnalysis.mentalScore;

      if (aiResult && aiResult.status === 'success') {
        console.log('[Integration] Menggunakan hasil analisa real-time dari FastAPI & Gemini.');
        
        // Membaca persentase probabilitas dinamis dari model FastAPI (XGBoost)
        const rawPrediction = aiResult.model_prediction?.probability || 0.1078;
        finalRiskScore = rawPrediction < 1 ? Math.round(rawPrediction * 100) : Math.round(rawPrediction);

        aiExplainerText = aiResult.ai_engine_output?.ai_explanation || 'Hasil analisis Gemini tidak tersedia.';
      } else {
        console.log('[Fallback] Server AI tidak terjangkau. Mengaktifkan sistem kalkulasi matematika lokal cadangan.');
        
        finalRiskScore = localAnalysis.finalRiskScore;
        aiExplainerText = `[Mode Cadangan] Berdasarkan BMI Anda (${localAnalysis.bmi}), Anda berada dalam kategori ${localAnalysis.classification}. Efek risiko: ${localAnalysis.riskEffect}.`;
      }

      await AssessmentRepository.saveAssessmentResult(userId, {
        finalRiskScore,
        physicalHealthScore,
        lifestyleScore,
        mentalScore,
        aiExplainerText,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          final_risk_score: finalRiskScore,
          physical_health_score: physicalHealthScore,
          lifestyle_score: lifestyleScore,
          mental_score: mentalScore,
          ai_explainer_text: aiExplainerText,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async generatePlan(req, res, next) {
    try {
      const userId = req.user.id;

      const latestAssessment = await DashboardRepository.getLatestAssessmentResult(userId);
      if (!latestAssessment) {
        throw new InvariantError('Anda harus menyelesaikan kuesioner assessment kesehatan terlebih dahulu.');
      }

      let activeProgram = await DashboardRepository.getActiveProgram(userId);
      if (!activeProgram) {
        activeProgram = await DashboardRepository.createDefaultProgram(userId, latestAssessment.id);
        await DashboardRepository.upsertTreeStatus(userId, 'healthy');
      }

      return res.status(201).json({
        status: 'success',
        message: 'Program rencana aksi sehat selama 7 hari berhasil diaktifkan.',
        data: {
          programId: activeProgram.id,
          currentWeek: activeProgram.current_week,
          currentDay: activeProgram.current_day,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentController();