import express from 'express';
import JourneyController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Journey Log
 *   description: API untuk Mengakses Arsip Rekam Jejak Mingguan dan Evaluasi
 */

/**
 * @swagger
 * /journey-log/summary:
 *   get:
 *     summary: Mendapatkan rekapitulasi kepatuhan global dan list tabel utama mingguan
 *     tags: [Journey Log]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sukses mengambil summary rekam jejak
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/summary', authMiddleware, JourneyController.getSummary);

/**
 * @swagger
 * /journey-log/detail/{cycleId}:
 *   get:
 *     summary: Mendapatkan data sub-tabel detail saat tombol "Lihat Detail" diklik
 *     tags: [Journey Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Masukkan angka ID evaluasi mingguan (contohnya angka 1)
 *         example: 1
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail mingguan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/detail/:cycleId', authMiddleware, JourneyController.getDetail);

export default router;