import express from 'express';
import AssessmentController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assessment
 *   description: API Manajemen Data Fisik dan Pengisian Kuesioner Medis Pengguna
 */

/**
 * @swagger
 * /assessment/profile:
 *   post:
 *     summary: Menyimpan data medis dasar sebelum kuesioner (Lanjut ke Kuisioner)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - age
 *               - gender
 *               - height
 *               - weight
 *               - activity_level
 *             properties:
 *               age:
 *                 type: integer
 *                 example: 20
 *               gender:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 0 untuk Perempuan, 1 untuk Laki-laki
 *                 example: 1
 *               height:
 *                 type: number
 *                 example: 167.0
 *               weight:
 *                 type: number
 *                 example: 71.0
 *               activity_level:
 *                 type: string
 *                 enum: [working, not_working, freelance, household, student, retired]
 *                 example: freelance
 *               family_history:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["hypertension"]
 *     responses:
 *       200:
 *         description: Data medis awal berhasil disimpan
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
 *                   example: Data medis awal berhasil disimpan.
 */
router.post('/profile', authMiddleware, AssessmentController.saveProfile);

/**
 * @swagger
 * /assessment/questions:
 *   get:
 *     summary: Menarik 11 daftar pertanyaan indikator risiko PTM dari database
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pertanyaan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *             example:
 *               status: "success"
 *               data: [
 *                 {
 *                   "id": 1,
 *                   "question_text": "Apakah Anda pernah dinyatakan memiliki riwayat tekanan darah tinggi (Hipertensi) oleh dokter atau tenaga medis?",
 *                   "category": "tensi",
 *                   "options": [
 *                     { "id": 1, "option_text": "Tidak, tekanan darah saya selalu normal setiap kali diperiksa", "score_weight": 0 },
 *                     { "id": 2, "option_text": "Pernah, tetapi hanya saat masa kehamilan saja", "score_weight": 0 },
 *                     { "id": 3, "option_text": "Ya, saya memiliki riwayat tekanan darah tinggi berdasarkan diagnosis medis", "score_weight": 1 }
 *                   ]
 *                 }
 *               ]
 */
router.get('/questions', authMiddleware, AssessmentController.getQuestions);

/**
 * @swagger
 * /assessment/submit:
 *   post:
 *     summary: Mengirimkan 11 jawaban kuesioner untuk mengalkulasi skor risiko kesehatan (Analisis Kesehatan Saya)
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_id
 *                     - score_weight
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                       example: 1
 *                     score_weight:
 *                       type: integer
 *                       example: 1
 *                 example: [
 *                   { "question_id": 1, "score_weight": 1 },
 *                   { "question_id": 2, "score_weight": 0 },
 *                   { "question_id": 3, "score_weight": 0 },
 *                   { "question_id": 4, "score_weight": 0 },
 *                   { "question_id": 5, "score_weight": 1 },
 *                   { "question_id": 6, "score_weight": 1 },
 *                   { "question_id": 7, "score_weight": 1 },
 *                   { "question_id": 8, "score_weight": 0 },
 *                   { "question_id": 9, "score_weight": 0 },
 *                   { "question_id": 10, "score_weight": 3 },
 *                   { "question_id": 11, "score_weight": 0 }
 *                 ]
 *     responses:
 *       200:
 *         description: Berhasil mengalkulasi skor risiko kesehatan dan mengembalikan hasil analisis medis
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
 *                     final_risk_score:
 *                       type: integer
 *                       example: 79
 *                     physical_health_score:
 *                       type: integer
 *                       example: 62
 *                     lifestyle_score:
 *                       type: integer
 *                       example: 10
 *                     mental_score:
 *                       type: integer
 *                       example: 50
 *                     ai_explainer_text:
 *                       type: string
 *                       example: Tingkat risiko kesehatan fisik Anda adalah 62%...
 */
router.post('/submit', authMiddleware, AssessmentController.submitAssessment);

export default router;