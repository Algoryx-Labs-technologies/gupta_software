import type { Request, Response } from 'express';
import type { DashboardSummaryQuery } from '@gupta/shared';
import * as svc from './dashboard.service.js';

export async function summary(req: Request, res: Response) {
  const { dateFrom, dateTo, tender } = req.query as DashboardSummaryQuery;
  res.json(await svc.getSummary(dateFrom, dateTo, tender));
}
