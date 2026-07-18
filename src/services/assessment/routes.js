import express from 'express';
import AssessmentController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /assessment/profile:
 *   post:
 *     summary: Menyimpan data medis dasar sebelum kuesioner
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [age, gender, height, weight, activityLevel]
 *             properties:
 *               age: { type: integer, example: 20 }
 *               gender: { type: integer, example: 1 }
 *               height: { type: number, example: 167.0 }
 *               weight: { type: number, example: 71.0 }
 *               activityLevel: { type: string, example: freelance }
 *               familyHistory: { type: array, items: { type: string }, example: ["hypertension"] }
 */
router.post('/profile', authMiddleware, AssessmentController.saveProfile);

/**
 * @swagger
 * /assessment/questions:
 *   get:
 *     summary: Menarik 11 daftar pertanyaan indikator risiko dari database
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 */
router.get('/questions', authMiddleware, AssessmentController.getQuestions);

/**
 * @swagger
 * /assessment/submit:
 *   post:
 *     summary: Mengalkulasi data kuis dan profil, mengembalikan 4 angka pilar medis
 *     tags: [Assessment]
 *     security:
 *       - bearerAuth: []
 */
router.post('/submit', authMiddleware, AssessmentController.submitAssessment);

export default router;