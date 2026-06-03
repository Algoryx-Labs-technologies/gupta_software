import { Router } from 'express';
import {
  Permission,
  paginationQuerySchema,
  createSiteSchema,
  updateSiteSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './sites.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_MASTERS));

router.get('/search', asyncHandler(ctrl.search));
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createSiteSchema), activityLogger('create', 'Site'), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getById));
router.patch('/:id', validate(updateSiteSchema), activityLogger('update', 'Site'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Site'), asyncHandler(ctrl.remove));

export default router;
