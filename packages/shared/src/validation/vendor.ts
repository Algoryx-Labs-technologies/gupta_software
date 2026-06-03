import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gstin: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = createVendorSchema.partial();

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
