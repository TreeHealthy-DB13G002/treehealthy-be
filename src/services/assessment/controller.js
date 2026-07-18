import Joi from 'joi';
import AssessmentRepository from './repositories.js';
import UserRepository from '../auth/repositories.js'; // Koreksi jalur impor ke modul auth
import InvariantError from '../../exceptions/InvariantError.js';
import { calculateBMI, getBMIMedicalStatus, getFamilyHistoryPenalty } from './healthCalculator.js';

export const assessmentProfileSchema = Joi.object({
  age: Joi.number().integer().min(18).max(120).required(),
  gender: Joi.number().valid(0, 1).required(),
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  activityLevel: Joi.string().valid('working', 'not_working', 'freelance', 'household', 'retired', 'student').required(),
  familyHistory: Joi.array().items(Joi.string().valid('hypertension', 'diabetes', 'heart_disease')).default([]),
});

class AssessmentController {
  async saveProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = assessmentProfileSchema.validate(req.body);
      if (error) throw new InvariantError(error.details[0].message);

      const { age, gender, height, weight, activityLevel, familyHistory } = value;

      await AssessmentRepository.saveProfile(userId, { age, gender, height, weight, activityLevel });

      // Map penyakit keluarga ke master database
      const mappedDiseases = familyHistory.map(d => {
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
      const questions = await AssessmentRepository.getQuestions();
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

      // Ambil data profil fisik user dari database
      const fullProfile = await UserRepository.getCompleteUserProfile(userId);
      const { age, height, weight, activities } = fullProfile.profile;
      const familyDiseases = fullProfile.familyDiseases;

      const findScore = (id) => answers.find(a => a.question_id === id)?.score_weight || 0;

      const highBP = findScore(1);
      const heartDisease = findScore(2);
      const smoker = findScore(3);
      const hvyAlcohol = findScore(4);
      const physActivity = findScore(5);
      const fruits = findScore(6);
      const veggies = findScore(7);
      const noDocbc = findScore(8);
      const diffWalk = findScore(9);
      const mentHlthDays = findScore(10); 
      const physHlthDays = findScore(11); 

      // --- PERHITUNGAN BAR SESUAI HALAMAN 13 PDF ---
      const bmi = calculateBMI(weight, height);
      const bmiStatus = getBMIMedicalStatus(bmi);
      const bmiScore = bmiStatus.baseScore / 90; 
      const familyPenalty = getFamilyHistoryPenalty(familyDiseases);

      const bar1Raw = (highBP + heartDisease + diffWalk + (physHlthDays / 30) + bmiScore + familyPenalty) / 5.2;
      const physical_health_score = Math.min(100, Math.round(bar1Raw * 100));

      const activeScore = physActivity === 1 ? 1 : 0;
      const fruitScore = fruits === 1 ? 1 : 0;
      const vegScore = veggies === 1 ? 1 : 0;
      const smokeScore = smoker === 0 ? 1 : 0; 
      const alcoholScore = hvyAlcohol === 0 ? 1 : 0; 

      const bar2Raw = (activeScore + fruitScore + vegScore + smokeScore + alcoholScore) / 5;
      const lifestyle_score = Math.round(bar2Raw * 100);

      const bar3Raw = ((mentHlthDays / 30) + noDocbc) / 2;
      const mental_score = Math.round(bar3Raw * 100);

      const final_risk_score = Math.round((physical_health_score * 0.5) + ((100 - lifestyle_score) * 0.3) + (mental_score * 0.2));

      const ai_explainer_text = `Tingkat risiko kesehatan fisik dan metabolik Anda berada di angka ${physical_health_score}%. Kepatuhan gaya hidup sehat Anda tercatat sebesar ${lifestyle_score}%. Kondisi mental dan akses medis menunjukkan hambatan sebesar ${mental_score}%. Model memprediksi risiko kumulatif PTM Anda adalah ${final_risk_score}%.`;

      await AssessmentRepository.saveAssessmentResult(userId, {
        finalRiskScore: final_risk_score,
        physicalHealthScore: physical_health_score,
        lifestyleScore: lifestyle_score,
        mentalScore: mental_score,
        aiExplainerText: ai_explainer_text,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          final_risk_score,
          physical_health_score,
          lifestyle_score,
          mental_score,
          ai_explainer_text,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssessmentController();