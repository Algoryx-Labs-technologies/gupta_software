import { z } from 'zod';
import { objectIdSchema } from './common.js';

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(20),
  employeeId: z.string().min(1, 'Employee ID is required').max(50),
  salary: z.coerce.number().min(0, 'Salary must be 0 or more'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const employeeFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['unassigned', 'assigned', 'changed']).optional(),
  tender: objectIdSchema.optional(),
});

export type EmployeeFilterInput = z.infer<typeof employeeFilterSchema>;

export const assignEmployeeSchema = z.object({
  tender: objectIdSchema,
});

export type AssignEmployeeInput = z.infer<typeof assignEmployeeSchema>;

export const changeEmployeeTenderSchema = z.object({
  tender: objectIdSchema,
  daysWorkedOnCurrent: z.coerce.number().int().min(0, 'Days must be 0 or more'),
});

export type ChangeEmployeeTenderInput = z.infer<typeof changeEmployeeTenderSchema>;

export const unassignEmployeeSchema = z.object({
  daysWorkedOnCurrent: z.coerce.number().int().min(0, 'Days must be 0 or more').optional(),
});

export type UnassignEmployeeInput = z.infer<typeof unassignEmployeeSchema>;

export const updateEmployeeDaysSchema = z.object({
  daysWorked: z.coerce.number().int().min(0, 'Days must be 0 or more'),
});

export type UpdateEmployeeDaysInput = z.infer<typeof updateEmployeeDaysSchema>;

export const tenderExpenseFilterSchema = z.object({
  tender: objectIdSchema.optional(),
});

export type TenderExpenseFilterInput = z.infer<typeof tenderExpenseFilterSchema>;
