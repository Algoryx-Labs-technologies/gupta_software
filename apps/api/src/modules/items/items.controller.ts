import type { Request, Response } from 'express';
import * as svc from './items.service.js';

export async function list(req: Request, res: Response) {
  const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
  res.json(await svc.list(page, limit, search));
}

export async function search(req: Request, res: Response) {
  res.json(await svc.search((req.query.q as string) || ''));
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
  res.json({ message: 'Item deleted' });
}
