import express from 'express';
import UserController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API Manajemen Profil Fisik dan Evaluasi Risiko Kesehatan Pengguna
 */

/**
 * @swagger
 * /users/assessment:
 *   post:
 *     summary: Mengirimkan Data Survei Penilaian Risiko Kesehatan Pertama Kali (Halaman Assessment)
 *     tags: [Users]
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
 *               - height
 *               - weight
 *               - gender
 *               - activities
 *             properties:
 *               age:
 *                 type: integer
 *                 description: Usia asli dalam tahun
 *                 example: 20
 *               height:
 *                 type: number
 *                 description: Tinggi badan dalam satuan centimeter (cm)
 *                 example: 167.0
 *               weight:
 *                 type: number
 *                 description: Berat badan dalam satuan kilogram (kg)
 *                 example: 71.0
 *               gender:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 0 untuk Perempuan, 1 untuk Laki-laki
 *                 example: 1
 *               activities:
 *                 type: string
 *                 enum: [working, not_working, freelance, household, student, retired]
 *                 example: freelance
 *               family_diseases:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [diabetes, hipertensi, jantung/kronis]
 *                 example: ["diabetes"]
 *     responses:
 *       201:
 *         description: Penilaian berhasil dihitung, mengembalikan hasil analisis untuk slide terakhir kuesioner
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
 *                   example: Hasil penilaian risiko berhasil dihitung.
 *                 data:
 *                   type: object
 *                   properties:
 *                     bmi:
 *                       type: number
 *                       example: 25.5
 *                     classification:
 *                       type: string
 *                       example: Obesitas Tingkat I (Obese I)
 *                     risk_effect:
 *                       type: string
 *                       example: Tinggi (Pemicu utama diabetes tipe 2)
 *                     scores:
 *                       type: object
 *                       properties:
 *                         physical_health_score:
 *                           type: integer
 *                           example: 62
 *                         lifestyle_score:
 *                           type: integer
 *                           example: 10
 *                         mental_score:
 *                           type: integer
 *                           example: 50
 *                         final_risk_score:
 *                           type: integer
 *                           example: 79
 *                     ai_explainer_text:
 *                       type: string
 *                       example: Berdasarkan BMI Anda (25.5), Anda berada dalam kategori Obesitas Tingkat I (Obese I).
 *       401:
 *         description: Tidak diotorisasi (Token hilang atau salah)
 */
router.post('/assessment', authMiddleware, UserController.submitAssessment);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Mendapatkan Informasi Pengguna Lengkap Beserta Hasil Analisis Kesehatan (Halaman Profile)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data untuk mempopulasi formulir halaman Profile
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
 *                     fullname:
 *                       type: string
 *                       example: Alexander Ibraheem
 *                     username:
 *                       type: string
 *                       example: ibraheem
 *                     profile:
 *                       type: object
 *                       properties:
 *                         age:
 *                           type: integer
 *                           example: 20
 *                         height:
 *                           type: number
 *                           example: 167.0
 *                         weight:
 *                           type: number
 *                           example: 71.0
 *                         gender:
 *                           type: integer
 *                           example: 1
 *                         activities:
 *                           type: string
 *                           example: freelance
 *                     family_diseases:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["diabetes"]
 *                     health_analysis:
 *                       type: object
 *                       properties:
 *                         physical_health_score:
 *                           type: integer
 *                           example: 62
 *                         lifestyle_score:
 *                           type: integer
 *                           example: 10
 *                         mental_score:
 *                           type: integer
 *                           example: 50
 *                         final_risk_score:
 *                           type: integer
 *                           example: 79
 *                         ai_explainer_text:
 *                           type: string
 *                           example: Berdasarkan BMI Anda (25.5), Anda berada dalam kategori Obesitas Tingkat I.
 *       401:
 *         description: Tidak diotorisasi
 *       404:
 *         description: Profil pengguna belum dibuat
 */
router.get('/profile', authMiddleware, UserController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Memperbarui Informasi Pengguna Dasar dan Data Fisik Medis (Halaman Update Profile)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - username
 *               - age
 *               - height
 *               - weight
 *               - gender
 *               - activities
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Alexander Ibraheem Pratama
 *               username:
 *                 type: string
 *                 example: alexibraheem
 *               age:
 *                 type: integer
 *                 example: 21
 *               height:
 *                 type: number
 *                 example: 167.0
 *               weight:
 *                 type: number
 *                 example: 70.0
 *               gender:
 *                 type: integer
 *                 example: 1
 *               activities:
 *                 type: string
 *                 example: working
 *               family_diseases:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["diabetes", "hipertensi"]
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui beserta perhitungan ulang skor risiko medis
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
 *                   example: Profil kesehatan berhasil diperbarui.
 *                 data:
 *                   type: object
 *                   properties:
 *                     fullname:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profile:
 *                       type: object
 *                     health_analysis:
 *                       type: object
 *       401:
 *         description: Tidak diotorisasi
 */
router.put('/profile', authMiddleware, UserController.updateProfile);

export default router;