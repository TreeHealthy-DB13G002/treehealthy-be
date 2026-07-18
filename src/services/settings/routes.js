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
 *   put:
 *     summary: Menyimpan perubahan data akun dan data fisik terbaru dari user
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authMiddleware, SettingsController.getProfile);
router.put('/profile', authMiddleware, SettingsController.updateProfile);

export default router;