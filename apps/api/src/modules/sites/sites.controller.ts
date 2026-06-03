import type { Request, Response } from 'express';
import * as sitesService from './sites.service.js';

export async function list(req: Request, res: Response) {
  const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
  res.json(await sitesService.list(page, limit, search));
}

export async function search(req: Request, res: Response) {
  const q = (req.query.q as string) || '';
  res.json(await sitesService.search(q));
}

export async function create(req: Request, res: Response) {
  const site = await sitesService.create(req.body);
  res.status(201).json(site);
}

export async function getById(req: Request, res: Response) {
  res.json(await sitesService.getById(req.params.id));
}

export async function update(req: Request, res: Response) {
  res.json(await sitesService.update(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await sitesService.remove(req.params.id);
  res.json({ message: 'Site deleted' });
}
