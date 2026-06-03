import type { Request, Response } from 'express';
import * as svc from './dashboard.service.js';

export async function summary(req: Request, res: Response) {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
  res.json(await svc.getSummary(dateFrom, dateTo));
}
