import { Router } from 'express';
import {
  Permission,
  tenderFilterSchema,
  createTenderSchema,
  updateTenderSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import { upload } from '../../utils/upload.js';
import * as ctrl from './tenders.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_TENDERS));

router.get('/export', validate(tenderFilterSchema, 'query'), asyncHandler(ctrl.exportData));
router.get('/', validate(tenderFilterSchema, 'query'), asyncHandler(ctrl.list));
router.post('/', validate(createTenderSchema), activityLogger('create', 'Tender'), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getById));
router.patch('/:id', validate(updateTenderSchema), activityLogger('update', 'Tender'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Tender'), asyncHandler(ctrl.remove));
router.post('/:id/attachments', upload.single('file'), asyncHandler(ctrl.uploadAttachment));

export default router;
