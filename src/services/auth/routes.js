import express from 'express';
import UserController from '../users/controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API untuk Pendaftaran Akun dan Otentikasi Pengguna
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrasi Akun Pengguna Baru
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
 * /auth/login:
 *   post:
 *     summary: Autentikasi Pengguna (Login)
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

export default router;