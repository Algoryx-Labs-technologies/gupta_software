import type { Request, Response } from 'express';
import * as svc from './stock.service.js';

export async function matrix(_req: Request, res: Response) {
  res.json(await svc.getMatrix());
}

export async function upsertCell(req: Request, res: Response) {
  res.json(await svc.upsertCell(req.body));
}

export async function list(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  res.json(await svc.list(page, limit));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await svc.create(req.body));
}

export async function getById(req: Request, res: Response) {
  res.json(await svc.getById(req.params.id));
}

export async function update(req: Request, res: Response) {
  res.json(await svc.update(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await svc.remove(req.params.id);
  res.json({ message: 'Stock entry deleted' });
}
