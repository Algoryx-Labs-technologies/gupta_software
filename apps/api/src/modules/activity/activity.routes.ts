import { Router } from 'express';
import { Permission, paginationQuerySchema } from '@gupta/shared';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './activity.controller.js';

const activityFilterSchema = paginationQuerySchema.extend({
  entity: z.string().optional(),
  action: z.string().optional(),
});

const router = Router();

router.use(authenticate, authorize(Permission.VIEW_ACTIVITY_LOGS));

router.get('/export', validate(activityFilterSchema, 'query'), asyncHandler(ctrl.exportLogs));
router.get('/', validate(activityFilterSchema, 'query'), asyncHandler(ctrl.list));

export default router;
