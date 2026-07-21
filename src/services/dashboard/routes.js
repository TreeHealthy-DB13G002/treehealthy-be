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
 *         description: Masukkan angka ID tugas harian dari rute GET /current (contohnya angka 1)
 *         example: 1
 *     responses:
 *       200:
 *         description: Status checklist berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
 *                 description: Rating kepuasan fisik (Skala 1 - 5)
 *                 example: 4
 *               notes:
 *                 type: string
 *                 description: Refleksi catatan kesehatan mingguan
 *                 example: Minggu pertama berjalan dengan sangat baik dan stamina membaik.
 *               current_week:
 *                 type: integer
 *                 description: Angka minggu siklus yang diselesaikan (1 - 4)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Siklus mingguan berhasil diselesaikan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/cycle-complete', authMiddleware, DashboardController.completeCycle);

export default router;