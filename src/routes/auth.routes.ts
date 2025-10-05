import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    登入
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    登出
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    取得使用者資訊
 * @access  Private
 */
router.get('/me', authController.getMe);

export default router;
