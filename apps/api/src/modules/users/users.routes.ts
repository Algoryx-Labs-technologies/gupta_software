import { Router } from 'express';
import {
  Permission,
  paginationQuerySchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  resetPasswordSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as usersController from './users.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_USERS));

router.get('/', validate(paginationQuerySchema, 'query'), asyncHandler(usersController.list));
router.post(
  '/',
  validate(createUserSchema),
  activityLogger('create', 'User'),
  asyncHandler(usersController.create),
);
router.get('/:id', asyncHandler(usersController.getById));
router.patch(
  '/:id',
  validate(updateUserSchema),
  activityLogger('update', 'User'),
  asyncHandler(usersController.update),
);
router.patch(
  '/:id/status',
  validate(updateUserStatusSchema),
  activityLogger('update_status', 'User'),
  asyncHandler(usersController.updateStatus),
);
router.post(
  '/:id/reset-password',
  validate(resetPasswordSchema),
  activityLogger('reset_password', 'User'),
  asyncHandler(usersController.resetPassword),
);
router.delete(
  '/:id',
  activityLogger('delete', 'User'),
  asyncHandler(usersController.remove),
);

export default router;
