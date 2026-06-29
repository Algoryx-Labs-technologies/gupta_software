import type { Request, Response } from 'express';
import * as svc from './outstanding-payments.service.js';

export async function list(req: Request, res: Response) {
  res.json(await svc.list(req.query as never));
}

export async function create(req: Request, res: Response) {
  const payment = await svc.create(req.body, req.user!.sub);
  res.status(201).json(payment);
}

export async function remove(req: Request, res: Response) {
  await svc.remove(req.params.id);
  res.json({ message: 'Outstanding payment deleted' });
}

export async function summary(req: Request, res: Response) {
  const { dateFrom, dateTo, tender } = req.query as {
    dateFrom?: string;
    dateTo?: string;
    tender?: string;
  };
  res.json(
    await svc.getSummaryStats(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      tender,
    ),
  );
}
