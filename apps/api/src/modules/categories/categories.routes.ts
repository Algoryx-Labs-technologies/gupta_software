import { Router } from 'express';
import {
  Permission,
  paginationQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './categories.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_MASTERS));

router.get('/search', asyncHandler(ctrl.search));
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createCategorySchema), activityLogger('create', 'Category'), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getById));
router.patch('/:id', validate(updateCategorySchema), activityLogger('update', 'Category'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Category'), asyncHandler(ctrl.remove));

export default router;
