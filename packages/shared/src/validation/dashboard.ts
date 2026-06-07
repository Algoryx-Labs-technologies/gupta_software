import { z } from 'zod';
import { objectIdSchema } from './common.js';

export const dashboardSummaryQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  tender: objectIdSchema.optional(),
});

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;
