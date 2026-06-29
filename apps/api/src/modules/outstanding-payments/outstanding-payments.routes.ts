import { Router } from 'express';
import {
  Permission,
  createOutstandingPaymentSchema,
  outstandingPaymentFilterSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './outstanding-payments.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_TENDERS));

router.get('/summary', asyncHandler(ctrl.summary));
router.get('/', validate(outstandingPaymentFilterSchema, 'query'), asyncHandler(ctrl.list));
router.post(
  '/',
  validate(createOutstandingPaymentSchema),
  activityLogger('create', 'OutstandingPayment'),
  asyncHandler(ctrl.create),
);
router.delete(
  '/:id',
  activityLogger('delete', 'OutstandingPayment'),
  asyncHandler(ctrl.remove),
);

export default router;
