import express from 'express';
import UserController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrasi Akun Pengguna Baru
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - username
 *               - password
 *               - confirm_password
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Dode Eka
 *               username:
 *                 type: string
 *                 example: dodeeka
 *               password:
 *                 type: string
 *                 example: secretpassword
 *               confirm_password:
 *                 type: string
 *                 example: secretpassword
 *     responses:
 *       201:
 *         description: Registrasi berhasil
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
 *                   example: Registrasi berhasil.
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Validasi gagal atau username telah digunakan
 */
router.post('/register', UserController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Autentikasi Pengguna (Login)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: dodeeka
 *               password:
 *                 type: string
 *                 example: secretpassword
 *     responses:
 *       200:
 *         description: Login berhasil, mengembalikan Token JWT
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
 *                   example: Login berhasil.
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Kredensial tidak valid
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Memperbarui Informasi Pengguna dan Profil Kesehatan Fisik
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
 *               - activities
 *               - age
 *               - gender
 *               - height
 *               - weight
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Dode Eka Pratama
 *               username:
 *                 type: string
 *                 example: dodeekapratama
 *               activities:
 *                 type: string
 *                 enum: [working, not_working, freelance, household, student, retired]
 *                 example: working
 *               age:
 *                 type: integer
 *                 example: 27
 *               gender:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 0 untuk Perempuan, 1 untuk Laki-laki
 *                 example: 1
 *               height:
 *                 type: number
 *                 example: 175.5
 *               weight:
 *                 type: number
 *                 example: 72.5
 *               family_diseases:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [diabetes, hipertensi, jantung/kronis]
 *                 example: ["diabetes"]
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui beserta hasil kalkulasi BMI
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         fullname:
 *                           type: string
 *                         username:
 *                           type: string
 *                         activities:
 *                           type: string
 *                         age_scale:
 *                           type: integer
 *                         gender:
 *                           type: string
 *                         height:
 *                           type: number
 *                         weight:
 *                           type: number
 *                     health_analysis:
 *                       type: object
 *                       properties:
 *                         bmi:
 *                           type: number
 *                         classification:
 *                           type: string
 *                         risk_effect:
 *                           type: string
 *       401:
 *         description: Tidak diotorisasi (Token hilang atau salah)
 */
router.put('/profile', authMiddleware, UserController.updateProfile);

export default router;