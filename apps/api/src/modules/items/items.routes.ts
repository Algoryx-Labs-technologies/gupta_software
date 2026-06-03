import { Router } from 'express';
import {
  Permission,
  paginationQuerySchema,
  createItemSchema,
  updateItemSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './items.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_MASTERS));

router.get('/search', asyncHandler(ctrl.search));
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createItemSchema), activityLogger('create', 'Item'), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getById));
router.patch('/:id', validate(updateItemSchema), activityLogger('update', 'Item'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Item'), asyncHandler(ctrl.remove));

export default router;
