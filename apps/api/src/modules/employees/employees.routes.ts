import { Router } from 'express';
import {
  Permission,
  assignEmployeeSchema,
  changeEmployeeTenderSchema,
  createEmployeeSchema,
  employeeFilterSchema,
  tenderExpenseFilterSchema,
  unassignEmployeeSchema,
  updateEmployeeDaysSchema,
  updateEmployeeSchema,
} from '@gupta/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLogger.js';
import * as ctrl from './employees.controller.js';

const router = Router();

router.use(authenticate, authorize(Permission.MANAGE_PURCHASES));

router.get('/tender-expenses', validate(tenderExpenseFilterSchema, 'query'), asyncHandler(ctrl.tenderExpenses));
router.get('/', validate(employeeFilterSchema, 'query'), asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getById));
router.post('/', validate(createEmployeeSchema), activityLogger('create', 'Employee'), asyncHandler(ctrl.create));
router.patch('/:id', validate(updateEmployeeSchema), activityLogger('update', 'Employee'), asyncHandler(ctrl.update));
router.delete('/:id', activityLogger('delete', 'Employee'), asyncHandler(ctrl.remove));
router.post('/:id/assign', validate(assignEmployeeSchema), activityLogger('update', 'Employee'), asyncHandler(ctrl.assign));
router.post('/:id/change-tender', validate(changeEmployeeTenderSchema), activityLogger('update', 'Employee'), asyncHandler(ctrl.changeTender));
router.post('/:id/unassign', validate(unassignEmployeeSchema), activityLogger('update', 'Employee'), asyncHandler(ctrl.unassign));
router.patch('/:id/days', validate(updateEmployeeDaysSchema), activityLogger('update', 'Employee'), asyncHandler(ctrl.updateDays));

export default router;
