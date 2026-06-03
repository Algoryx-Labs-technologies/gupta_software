import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { loginSchema, adminLoginSchema } from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import * as authController from './auth.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later' },
});

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post(
  '/admin/login',
  authLimiter,
  validate(adminLoginSchema),
  asyncHandler(authController.adminLogin),
);
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));
router.post('/refresh', asyncHandler(authController.refresh));

export default router;
