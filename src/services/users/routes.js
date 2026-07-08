import express from 'express';
import UserController from './controller.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.put('/profile', authMiddleware, UserController.updateProfile);

export default router;