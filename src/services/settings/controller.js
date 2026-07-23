import UserRepository from '../auth/repositories.js';
import AssessmentRepository from '../assessment/repositories.js';
import AIService from '../assessment/aiService.js'; // Impor AIService
import { settingsUpdateSchema } from './validator.js';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import { evaluateHealthRisk, calculateBMI } from '../assessment/healthCalculator.js';

class SettingsController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const fullProfile = await UserRepository.getCompleteUserProfile(userId);

      if (!fullProfile) throw new NotFoundError('Pengguna tidak ditemukan.');

      const mappedFamily = fullProfile.familyDiseases.map(d => {
        if (d === 'hypertension') return 'hypertension';
        if (d === 'heart_disease') return 'heart_disease';
        return d;
      });

      return res.status(200).json({
        status: 'success',
        data: {
          fullname: fullProfile.user.fullname,
          username: fullProfile.user.username,
          age: fullProfile.profile?.age || null,
          gender: fullProfile.profile?.gender === 'male' ? 1 : 0,
          height: fullProfile.profile?.height || null,
          weight: fullProfile.profile?.weight || null,
          activity_level: fullProfile.profile?.activities || null,
          family_history: mappedFamily,
          last_update: fullProfile.profile?.last_update || null, 
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { error, value } = settingsUpdateSchema.validate(req.body);
      if (error) throw new InvariantError(error.details[0].message);

      const { fullname, username, age, height, weight, gender, activity_level, family_history } = value;
      const genderString = gender === 1 ? 'male' : 'female';

      // 1. Perbarui data dasar di database
      await UserRepository.updateBasicUserInfo(userId, fullname, username);
      const updatedProfile = await UserRepository.createOrUpdateProfile(userId, {
        activities: activity_level,
        age,
        genderString,
        height,
        weight,
      });

      const mappedDiseases = family_history.map(d => {
        if (d === 'hypertension') return 'hipertensi';
        if (d === 'heart_disease') return 'jantung/kronis';
        return d;
      });
      await UserRepository.replaceFamilyDiseases(userId, mappedDiseases);

      // 2. Tarik jawaban kuesioner lama milik pengguna dari database
      const lastAnswers = await UserRepository.getUserLatestAnswers(userId);

      // 3. Tembak ulang ke server AI FastAPI untuk pembaruan analisis risiko
      const userProfile = {
        fullname,
        age,
        gender: genderString,
        height,
        weight,
        activities: activity_level,
      };

      const aiResult = await AIService.getAiRiskAnalysis(userProfile, lastAnswers);

      let finalRiskScore, physicalHealthScore, lifestyleScore, mentalScore, aiExplainerText;

      if (aiResult && aiResult.status === 'success') {
        console.log('[Settings Update - Integration] Berhasil memperbarui analisis medis via FastAPI & Gemini.');
        const rawPrediction = aiResult.model_prediction?.probability || 0.1078;
        finalRiskScore = Math.round(rawPrediction * 100);
        physicalHealthScore = 45; 
        lifestyleScore = 60;
        mentalScore = 55;
        aiExplainerText = aiResult.ai_engine_output?.ai_explanation || 'Hasil analisis Gemini tidak tersedia.';
      } else {
        console.log('[Settings Update - Fallback] Menggunakan kalkulator lokal cadangan.');
        const healthAnalysis = evaluateHealthRisk({
          weight,
          height,
          age,
          activities: activity_level,
          familyDiseases: mappedDiseases,
        });

        finalRiskScore = healthAnalysis.finalRiskScore;
        physicalHealthScore = healthAnalysis.physicalHealthScore;
        lifestyleScore = healthAnalysis.lifestyleScore;
        mentalScore = healthAnalysis.mentalScore;
        aiExplainerText = `[Mode Cadangan] Pembaruan Berhasil. Tingkat risiko fisik & metabolik Anda saat ini adalah ${healthAnalysis.physicalHealthScore}%.`;
      }

      // 4. Simpan hasil kalkulasi AI baru ke tabel 'assessment_results'
      await AssessmentRepository.saveAssessmentResult(userId, {
        finalRiskScore,
        physicalHealthScore,
        lifestyleScore,
        mentalScore,
        aiExplainerText,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Perubahan data profil berhasil disimpan.',
        data: {
          fullname,
          username,
          profile: {
            age,
            height,
            weight,
            gender,
            activity_level,
            last_update: updatedProfile.last_update, 
          },
          health_analysis: {
            bmi: calculateBMI(weight, height),
            scores: {
              physical_health_score: physicalHealthScore,
              lifestyle_score: lifestyleScore,
              mental_score: mentalScore,
              final_risk_score: finalRiskScore,
            },
            ai_explainer_text: aiExplainerText,
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();