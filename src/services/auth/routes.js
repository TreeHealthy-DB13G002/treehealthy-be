import express from 'express';
import AuthController from './controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Manajemen Pendaftaran Akun dan Hak Akses Pengguna
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Pendaftaran User Baru
 *     tags: [Auth]
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
 *                 example: Alexander Ibraheem
 *               username:
 *                 type: string
 *                 example: ibraheem
 *               password:
 *                 type: string
 *                 example: secretpassword
 *               confirm_password:
 *                 type: string
 *                 example: secretpassword
 *     responses:
 *       201:
 *         description: Registrasi sukses
 *       400:
 *         description: Validasi gagal
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Mendapatkan JWT Token dan flag status pengisian profil
 *     tags: [Auth]
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
 *                 example: ibraheem
 *               password:
 *                 type: string
 *                 example: secretpassword
 *     responses:
 *       200:
 *         description: Login sukses, mengembalikan token JWT dan flag status profil
 */
router.post('/login', AuthController.login);

export default router;