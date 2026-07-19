import type { Request, Response } from 'express';
import type { DashboardSummaryQuery } from '@gupta/shared';
import { logger } from '../../utils/logger.js';
import * as svc from './dashboard.service.js';

export async function summary(req: Request, res: Response) {
  const { dateFrom, dateTo, tender } = req.query as DashboardSummaryQuery;

  logger.info('[dashboard/summary] controller hit', {
    userId: req.user?.sub,
    query: req.query,
    dateFrom: dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom,
    dateTo: dateTo instanceof Date ? dateTo.toISOString() : dateTo,
    tender: tender ?? null,
  });

  try {
    const data = await svc.getSummary(dateFrom, dateTo, tender);
    res.json(data);
  } catch (err) {
    logger.error('[dashboard/summary] controller error', {
      userId: req.user?.sub,
      query: req.query,
      errorName: err instanceof Error ? err.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}
