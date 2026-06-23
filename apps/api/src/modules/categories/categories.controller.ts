import type { Request, Response } from 'express';
import * as categoriesService from './categories.service.js';

export async function list(req: Request, res: Response) {
  const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
  res.json(await categoriesService.list(page, limit, search));
}

export async function search(req: Request, res: Response) {
  const q = (req.query.q as string) || '';
  res.json(await categoriesService.search(q));
}

export async function create(req: Request, res: Response) {
  const category = await categoriesService.create(req.body);
  res.status(201).json(category);
}

export async function getById(req: Request, res: Response) {
  res.json(await categoriesService.getById(req.params.id));
}

export async function update(req: Request, res: Response) {
  res.json(await categoriesService.update(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await categoriesService.remove(req.params.id);
  res.json({ message: 'Category deleted' });
}
