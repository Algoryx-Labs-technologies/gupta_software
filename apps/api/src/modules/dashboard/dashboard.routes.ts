import { Router } from 'express';
import { Permission } from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import * as ctrl from './dashboard.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.VIEW_DASHBOARD));

router.get('/summary', asyncHandler(ctrl.summary));

export default router;
