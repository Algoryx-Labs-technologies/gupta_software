import { Router } from 'express';
import {
  Permission,
  paginationQuerySchema,
  stockCellSchema,
  createStockSchema,
  updateStockSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './stock.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_INVENTORY));

router.get('/matrix', asyncHandler(ctrl.matrix));
router.put('/cell', validate(stockCellSchema), activityLogger('upsert_cell', 'Stock'), asyncHandler(ctrl.upsertCell));
router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createStockSchema), activityLogger('create', 'Stock'), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getById));
router.patch('/:id', validate(updateStockSchema), activityLogger('update', 'Stock'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Stock'), asyncHandler(ctrl.remove));

export default router;
