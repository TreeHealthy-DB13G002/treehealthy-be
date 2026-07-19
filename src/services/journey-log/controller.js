import JourneyRepository from './repositories.js';
import NotFoundError from '../../exceptions/NotFoundError.js';

class JourneyController {
  async getSummary(req, res, next) {
    try {
      const userId = req.user.id;
      const evaluations = await JourneyRepository.getWeeklyEvaluations(userId);

      const completedWeeks = evaluations.length;
      const globalCompliance = evaluations.reduce((acc, curr) => acc + curr.avg_compliance, 0) / (completedWeeks || 1);

      return res.status(200).json({
        status: 'success',
        data: {
          globalCompliance: `${Math.round(globalCompliance)}%`,
          completedWeeks,
          evaluationsNeeded: 4 - completedWeeks,
          weeklyCycles: evaluations.map((item) => ({
            id: item.id,
            cycleName: `Siklus Minggu ${item.week_number}`,
            complianceRate: `${item.avg_compliance}%`,
            perfectDays: `${item.perfect_days}/7 Hari`,
            status: item.weekly_reflection ? 'Selesai' : 'Pending Evaluasi',
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req, res, next) {
    try {
      const userId = req.user.id;
      const { cycleId } = req.params;

      const evaluation = await JourneyRepository.getEvaluationById(userId, cycleId);
      if (!evaluation) {
        throw new NotFoundError('Evaluasi siklus mingguan tidak ditemukan.');
      }

      return res.status(200).json({
        status: 'success',
        data: {
          weekNumber: evaluation.week_number,
          complianceThisWeek: `${evaluation.avg_compliance}%`,
          perfectDays: evaluation.perfect_days,
          reflection: evaluation.weekly_reflection,
          aiInsight: evaluation.ai_weekly_insight,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async evaluateLate(req, res, next) {
    try {
      const userId = req.user.id;
      // Perbaikan: Destrukturisasi menggunakan penamaan snake_case sesuai request body Postman
      const { cycle_id, satisfaction_rating, notes } = req.body;

      const aiInsight = `Evaluasi susulan tersimpan. Untuk rating kepuasan fisik Anda (${satisfaction_rating}/5), disarankan untuk meningkatkan asupan nutrisi buah harian guna mendukung stamina tubuh.`;

      const updatedEval = await JourneyRepository.updateLateEvaluation(userId, cycle_id, {
        reflection: notes,
        satisfactionRating: satisfaction_rating,
        insight: aiInsight,
      });

      if (!updatedEval) {
        throw new NotFoundError('Evaluasi mingguan tidak ditemukan.');
      }

      return res.status(200).json({
        status: 'success',
        message: 'Evaluasi susulan berhasil disimpan.',
        data: {
          cycleId: updatedEval.id,
          aiInsight: updatedEval.ai_weekly_insight,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new JourneyController();