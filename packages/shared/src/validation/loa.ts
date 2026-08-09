import { z } from 'zod';
import { objectIdSchema } from './common.js';
import { mongoSafeDateSchema } from '../utils/mongoDate.js';

export const createLoaSchema = z.object({
  loaNumber: z.string().min(1, 'LOA number is required').max(100),
  loaDate: mongoSafeDateSchema,
  title: z.string().max(200, 'Title is too long').optional(),
  tender: objectIdSchema.optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

export type CreateLoaInput = z.infer<typeof createLoaSchema>;

export const updateLoaSchema = createLoaSchema.partial();

export type UpdateLoaInput = z.infer<typeof updateLoaSchema>;

export const loaFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tender: objectIdSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['loaDate', 'loaNumber', 'serialNo', 'createdAt']).optional().default('loaDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type LoaFilterInput = z.infer<typeof loaFilterSchema>;
