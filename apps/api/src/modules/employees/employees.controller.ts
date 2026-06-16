import type { Request, Response } from 'express';
import * as svc from './employees.service.js';

export async function list(req: Request, res: Response) {
  res.json(await svc.list(req.query as never));
}

export async function getById(req: Request, res: Response) {
  res.json(await svc.getById(req.params.id));
}

export async function create(req: Request, res: Response) {
  const employee = await svc.create(req.body, req.user!.sub);
  res.status(201).json(employee);
}

export async function update(req: Request, res: Response) {
  res.json(await svc.update(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await svc.remove(req.params.id);
  res.json({ message: 'Employee deleted' });
}

export async function assign(req: Request, res: Response) {
  res.json(await svc.assign(req.params.id, req.body));
}

export async function changeTender(req: Request, res: Response) {
  res.json(await svc.changeTender(req.params.id, req.body));
}

export async function unassign(req: Request, res: Response) {
  res.json(await svc.unassign(req.params.id, req.body));
}

export async function updateDays(req: Request, res: Response) {
  res.json(await svc.updateDays(req.params.id, req.body));
}

export async function tenderExpenses(req: Request, res: Response) {
  const { tender } = req.query as { tender?: string };
  res.json(await svc.getTenderExpenseSummary(tender));
}
