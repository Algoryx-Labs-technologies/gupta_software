import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  code: z.string().min(1, 'Site code is required'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

export const updateSiteSchema = createSiteSchema.partial();

export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
