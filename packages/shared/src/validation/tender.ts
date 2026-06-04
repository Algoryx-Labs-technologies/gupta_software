import { z } from 'zod';
import { TenderStatus } from '../enums.js';
import { objectIdSchema } from './common.js';

export const tenderSiteSchema = z.object({
  site: objectIdSchema.optional(),
  siteNameRaw: z.string().min(1, 'Site name is required'),
});

export type TenderSiteInput = z.infer<typeof tenderSiteSchema>;

export const createTenderSchema = z.object({
  tenderName: z.string().min(1, 'Tender name is required'),
  tenderNo: z.string().min(1, 'Tender number is required'),
  orderValue: z.coerce.number().min(0).default(0),
  emd: z.coerce.number().min(0).default(0),
  pg: z.coerce.number().min(0).default(0),
  sdFromBill: z.coerce.number().min(0).default(0),
  paymentReceivedTillDate: z.coerce.number().min(0).default(0),
  paymentOutstanding: z.coerce.number().min(0).default(0),
  executionPending: z.coerce.number().min(0).default(0),
  workCompleted: z.coerce.number().min(0).default(0),
  bgNumber: z.string().optional(),
  bgExpiryDate: z.coerce.date().optional(),
  status: z.nativeEnum(TenderStatus).default(TenderStatus.PENDING),
  sites: z.array(tenderSiteSchema).min(1, 'At least one site is required'),
  notes: z.string().optional(),
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;

export const updateTenderSchema = createTenderSchema.partial();

export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;

export const tenderFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(TenderStatus).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TenderFilterInput = z.infer<typeof tenderFilterSchema>;
