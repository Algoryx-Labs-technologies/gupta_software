import { Router } from 'express';
import {
  Permission,
  paginationQuerySchema,
  createVendorSchema,
  updateVendorSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './vendors.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_MASTERS));

router.get('/search', asyncHandler(ctrl.search));
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createVendorSchema), activityLogger('create', 'Vendor'), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getById));
router.patch('/:id', validate(updateVendorSchema), activityLogger('update', 'Vendor'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Vendor'), asyncHandler(ctrl.remove));

export default router;
