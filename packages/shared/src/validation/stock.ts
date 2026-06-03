import { z } from 'zod';
import { objectIdSchema } from './common.js';

export const createStockSchema = z.object({
  item: objectIdSchema,
  site: objectIdSchema,
  quantity: z.coerce.number().min(0),
  specification: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;

export const updateStockSchema = createStockSchema.partial();

export type UpdateStockInput = z.infer<typeof updateStockSchema>;

export const stockCellSchema = z.object({
  itemId: objectIdSchema,
  siteId: objectIdSchema,
  specification: z.string().optional().default(''),
  quantity: z.coerce.number().min(0),
});

export type StockCellInput = z.infer<typeof stockCellSchema>;
