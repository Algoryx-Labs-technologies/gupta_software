import { Router } from 'express';
import { Permission, dashboardSummaryQuerySchema } from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './dashboard.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.VIEW_DASHBOARD));

router.get('/summary', validate(dashboardSummaryQuerySchema, 'query'), asyncHandler(ctrl.summary));

export default router;
