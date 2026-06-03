import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().optional(),
  specification: z.string().optional(),
  defaultUnit: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = createItemSchema.partial();

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
