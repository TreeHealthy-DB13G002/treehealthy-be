import express from 'express';
import DashboardController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API untuk Mengelola Checklist Harian CERDIK dan Siklus Mingguan
 */

/**
 * @swagger
 * /dashboard/generate-plan:
 *   post:
 *     summary: Mengaktifkan siklus rencana sehat harian pengguna (Pilar CERDIK)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Program berhasil diaktifkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Program rencana aksi sehat selama 7 hari berhasil diaktifkan.
 */
router.post('/generate-plan', authMiddleware, DashboardController.generatePlan);

/**
 * @swagger
 * /dashboard/current:
 *   get:
 *     summary: Mendapatkan informasi data checklist, ptmRiskScore, streak harian, dan kesehatan pohon digital
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard terkini
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
 */
router.get('/current', authMiddleware, DashboardController.getCurrentDashboard);

/**
 * @swagger
 * /dashboard/tasks/{taskId}/toggle:
 *   patch:
 *     summary: Mengubah status checklist tugas harian dan memperbarui kesehatan pohon
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari tracker tugas harian (user_task_trackers)
 *         example: 1
 *     responses:
 *       200:
 *         description: Status checklist berhasil diperbarui
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
 */
router.patch('/tasks/:taskId/toggle', authMiddleware, DashboardController.toggleTask);

/**
 * @swagger
 * /dashboard/cycle-complete:
 *   post:
 *     summary: Menyelesaikan evaluasi siklus mingguan dan me-reset dashboard ke minggu berikutnya
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - satisfaction_rating
 *               - notes
 *               - current_week
 *             properties:
 *               satisfaction_rating:
 *                 type: integer
 *                 example: 4
 *               notes:
 *                 type: string
 *                 example: Minggu pertama berjalan dengan sangat baik.
 *               current_week:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Siklus berhasil diselesaikan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/cycle-complete', authMiddleware, DashboardController.completeCycle);

export default router;