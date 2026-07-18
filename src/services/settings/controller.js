import UserRepository from '../auth/repositories.js'; // Koreksi jalur impor ke modul auth
import AssessmentRepository from '../assessment/repositories.js';
import { settingsUpdateSchema } from './validator.js';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import { evaluateHealthRisk } from '../assessment/healthCalculator.js'; // Koreksi jalur impor ke modul assessment

class SettingsController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const fullProfile = await UserRepository.getCompleteUserProfile(userId);

      if (!fullProfile) throw new NotFoundError('Pengguna tidak ditemukan.');

      const mappedFamily = fullProfile.familyDiseases.map(d => {
        if (d === 'hipertensi') return 'hypertension';
        if (d === 'jantung/kronis') return 'heart_disease';
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
          activityLevel: fullProfile.profile?.activities || null,
          familyHistory: mappedFamily,
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

      const { fullname, username, age, height, weight, gender, activityLevel, familyHistory } = value;
      const genderString = gender === 1 ? 'male' : 'female';

      await UserRepository.updateBasicUserInfo(userId, fullname, username);

      await UserRepository.createOrUpdateProfile(userId, {
        activities: activityLevel,
        age,
        genderString,
        height,
        weight,
      });

      const mappedDiseases = familyHistory.map(d => {
        if (d === 'hypertension') return 'hipertensi';
        if (d === 'heart_disease') return 'jantung/kronis';
        return d;
      });
      await UserRepository.replaceFamilyDiseases(userId, mappedDiseases);

      const healthAnalysis = evaluateHealthRisk({
        weight,
        height,
        age,
        activities: activityLevel,
        familyDiseases: mappedDiseases,
      });

      const aiExplainerText = `Pembalikan Berhasil. Tingkat risiko fisik & metabolik Anda saat ini adalah ${healthAnalysis.physicalHealthScore}%. Kepatuhan gaya hidup sehat: ${healthAnalysis.lifestyleScore}%. Kesejahteraan mental: ${healthAnalysis.mentalScore}%.`;

      await AssessmentRepository.saveAssessmentResult(userId, {
        finalRiskScore: healthAnalysis.finalRiskScore,
        physicalHealthScore: healthAnalysis.physicalHealthScore,
        lifestyleScore: healthAnalysis.lifestyleScore,
        mentalScore: healthAnalysis.mentalScore,
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
            activityLevel,
          },
          health_analysis: {
            bmi: healthAnalysis.bmi,
            scores: {
              physical_health_score: healthAnalysis.physicalHealthScore,
              lifestyle_score: healthAnalysis.lifestyleScore,
              mental_score: healthAnalysis.mentalScore,
              final_risk_score: healthAnalysis.finalRiskScore,
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