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

/**
 * @swagger
 * /journey-log/evaluate-late:
 *   post:
 *     summary: Mengisi form evaluasi susulan mingguan jika terlewat
 *     tags: [Journey Log]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cycle_id
 *               - satisfaction_rating
 *               - notes
 *             properties:
 *               cycle_id:
 *                 type: integer
 *                 description: ID siklus evaluasi mingguan yang pending
 *                 example: 1
 *               satisfaction_rating:
 *                 type: integer
 *                 description: Rating kepuasan fisik (Skala 1 - 5)
 *                 example: 5
 *               notes:
 *                 type: string
 *                 description: Catatan evaluasi susulan
 *                 example: Mengisi kuesioner evaluasi minggu lalu yang terlewat.
 *     responses:
 *       200:
 *         description: Evaluasi susulan berhasil disimpan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/evaluate-late', authMiddleware, JourneyController.evaluateLate);

export default router;