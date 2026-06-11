import { Router } from 'express';
import {
  Permission,
  allocateStockSchema,
  consumeStockSchema,
  inventoryLedgerFilterSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './inventory.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_INVENTORY));

router.get('/overview', asyncHandler(ctrl.overview));
router.get('/receipts', asyncHandler(ctrl.receipts));
router.get('/ledger', validate(inventoryLedgerFilterSchema, 'query'), asyncHandler(ctrl.ledger));
router.post('/allocate', validate(allocateStockSchema), activityLogger('allocate', 'Inventory'), asyncHandler(ctrl.allocate));
router.post('/consume', validate(consumeStockSchema), activityLogger('consume', 'Inventory'), asyncHandler(ctrl.consume));
router.post('/backfill', activityLogger('backfill', 'Inventory'), asyncHandler(ctrl.backfill));

export default router;
