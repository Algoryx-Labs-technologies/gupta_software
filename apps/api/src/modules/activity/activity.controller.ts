import type { Request, Response } from 'express';
import * as svc from './activity.service.js';

export async function list(req: Request, res: Response) {
  const { page, limit, entity, action, search } = req.query as unknown as {
    page: number;
    limit: number;
    entity?: string;
    action?: string;
    search?: string;
  };
  res.json(await svc.list(page, limit, { entity, action, search }));
}

export async function exportLogs(req: Request, res: Response) {
  const { entity, action } = req.query as { entity?: string; action?: string };
  const data = await svc.exportLogs({ entity, action });
  res.json({ data });
}
