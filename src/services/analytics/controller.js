import AnalyticsRepository from './repositories.js';

class AnalyticsController {
  async getChartsData(req, res, next) {
    try {
      const userId = req.user.id;

      const riskHistory = await AnalyticsRepository.getRiskHistory(userId);
      const complianceHistory = await AnalyticsRepository.getTaskCompliance(userId);

      // Format data koordinat untuk grafik Recharts Frontend
      const riskTrend = riskHistory.map((item, idx) => ({
        label: `Tes ${idx + 1}`,
        riskScore: item.final_risk_score,
      }));

      const complianceData = complianceHistory.map((item) => {
        const rate = (parseInt(item.completed) / parseInt(item.total)) * 100;
        return {
          date: new Date(item.log_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          complianceRate: Math.round(rate),
        };
      });

      return res.status(200).json({
        status: 'success',
        data: {
          riskTrend,
          complianceData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();