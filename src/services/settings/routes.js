import express from 'express';
import SettingsController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /settings/profile:
 *   get:
 *     summary: Mengambil data profil lengkap untuk initial value form settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil memuat data profil lama
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
 *                     fullname: { type: string, example: "Alexander Ibraheem" }
 *                     username: { type: string, example: "ibraheem" }
 *                     age: { type: integer, example: 20 }
 *                     gender: { type: integer, example: 1 }
 *                     height: { type: number, example: 167 }
 *                     weight: { type: number, example: 71 }
 *                     activity_level: { type: string, example: "freelance" }
 *                     family_history: { type: array, items: { type: string }, example: ["hypertension"] }
 *                     last_update: { type: string, example: "2026-07-21T11:41:55.746Z" }
 *   put:
 *     summary: Menyimpan perubahan data akun dan data fisik terbaru dari user
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullname, username, age, height, weight, gender, activity_level]
 *             properties:
 *               fullname: { type: string, example: "Alexander Ibraheem" }
 *               username: { type: string, example: "ibraheem" }
 *               age: { type: integer, example: 20 }
 *               gender: { type: integer, example: 1 }
 *               height: { type: number, example: 167.0 }
 *               weight: { type: number, example: 71.0 }
 *               activity_level: { type: string, example: "freelance" }
 *               family_history: { type: array, items: { type: string }, example: ["hypertension"] }
 *     responses:
 *       200:
 *         description: Perubahan profil berhasil disimpan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/profile', authMiddleware, SettingsController.getProfile);
router.put('/profile', authMiddleware, SettingsController.updateProfile);

export default router;