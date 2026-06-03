import { z } from 'zod';
import { objectIdSchema } from './common.js';

const optionalNumber = z.coerce.number().optional().nullable();

export const createPurchaseSchema = z.object({
  vendor: objectIdSchema.optional(),
  vendorNameRaw: z.string().min(1, 'Vendor name is required'),
  itemDescription: z.string().min(1, 'Item description is required'),
  item: objectIdSchema.optional(),
  billDate: z.coerce.date(),
  billNo: z.string().min(1, 'Bill number is required'),
  site: objectIdSchema.optional(),
  siteNameRaw: z.string().min(1, 'Site name is required'),
  qty: optionalNumber,
  unit: z.string().optional(),
  perRate: optionalNumber,
  freight: z.coerce.number().min(0).default(0),
  labour: z.coerce.number().min(0).default(0),
  gstPercent: z.coerce.number().min(0).max(100).default(18),
  isHmPurchase: z.boolean().default(false),
  notes: z.string().optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const updatePurchaseSchema = createPurchaseSchema.partial();

export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;

export const purchaseFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  site: objectIdSchema.optional(),
  vendor: objectIdSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PurchaseFilterInput = z.infer<typeof purchaseFilterSchema>;

export function computePurchaseTotals(input: {
  qty?: number | null;
  perRate?: number | null;
  freight?: number;
  labour?: number;
  gstPercent?: number;
}) {
  const qty = input.qty ?? 0;
  const perRate = input.perRate ?? 0;
  const freight = input.freight ?? 0;
  const labour = input.labour ?? 0;
  const gstPercent = input.gstPercent ?? 18;

  const subTotal = Math.round((qty * perRate + freight + labour) * 100) / 100;
  const gstAmount = Math.round(subTotal * (gstPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subTotal + gstAmount) * 100) / 100;

  return { subTotal, gstAmount, grandTotal };
}
