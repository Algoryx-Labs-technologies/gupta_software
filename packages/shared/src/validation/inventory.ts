import { z } from 'zod';
import { InventoryMovementType } from '../enums.js';
import { objectIdSchema } from './common.js';

const inventoryItemRefSchema = z.object({
  itemId: objectIdSchema.optional(),
  itemDescription: z.string().min(1, 'Item description is required'),
  unit: z.string().optional(),
});

export const allocateStockSchema = inventoryItemRefSchema
  .extend({
    fromSiteId: objectIdSchema,
    toSiteId: objectIdSchema.optional(),
    toSiteName: z.string().trim().optional(),
    quantity: z.coerce.number().positive('Quantity must be greater than zero'),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.toSiteId && !data.toSiteName) {
      ctx.addIssue({
        code: 'custom',
        message: 'Destination site is required',
        path: ['toSiteId'],
      });
    }
  });

export type AllocateStockInput = z.infer<typeof allocateStockSchema>;

export const consumeStockSchema = inventoryItemRefSchema.extend({
  siteId: objectIdSchema,
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  notes: z.string().optional(),
});

export type ConsumeStockInput = z.infer<typeof consumeStockSchema>;

export const inventoryLedgerFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  site: objectIdSchema.optional(),
  itemId: objectIdSchema.optional(),
  category: objectIdSchema.optional(),
  movementType: z.nativeEnum(InventoryMovementType).optional(),
  search: z.string().optional(),
});

export type InventoryLedgerFilterInput = z.infer<typeof inventoryLedgerFilterSchema>;
