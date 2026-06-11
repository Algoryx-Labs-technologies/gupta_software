import type { Request, Response } from 'express';
import * as svc from './inventory.service.js';

export async function overview(_req: Request, res: Response) {
  res.json(await svc.getOverview());
}

export async function receipts(_req: Request, res: Response) {
  res.json({ data: await svc.getReceipts() });
}

export async function allocate(req: Request, res: Response) {
  res.json(await svc.allocateStock(req.body, req.user!.sub));
}

export async function consume(req: Request, res: Response) {
  res.json(await svc.consumeStock(req.body, req.user!.sub));
}

export async function ledger(req: Request, res: Response) {
  res.json(await svc.listLedger(req.query as never));
}

export async function backfill(req: Request, res: Response) {
  res.json(await svc.backfillPurchaseLedger(req.user!.sub));
}
