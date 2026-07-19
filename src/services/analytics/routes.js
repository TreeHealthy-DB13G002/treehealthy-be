import express from 'express';
import AnalyticsController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /analytics/charts:
 *   get:
 *     summary: Menyuplai koordinat grafik tren risiko PTM dan tingkat kepatuhan aktivitas sehat
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Koordinat grafik berhasil dikirim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     riskTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label: { type: string, example: "Tes 1" }
 *                           riskScore: { type: integer, example: 79 }
 *                     complianceData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date: { type: string, example: "19 Jul" }
 *                           complianceRate: { type: integer, example: 85 }
 */
router.get('/charts', authMiddleware, AnalyticsController.getChartsData);

export default router;