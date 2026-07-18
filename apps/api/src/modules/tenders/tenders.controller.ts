import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { storeAttachment } from '../../utils/attachmentStorage.js';
import * as svc from './tenders.service.js';

export async function list(req: Request, res: Response) {
  res.json(await svc.list(req.query as never));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await svc.create(req.body, req.user!.sub));
}

export async function getById(req: Request, res: Response) {
  res.json(await svc.getById(req.params.id));
}

export async function update(req: Request, res: Response) {
  res.json(await svc.update(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await svc.remove(req.params.id);
  res.json({ message: 'Tender deleted' });
}

export async function uploadAttachment(req: Request, res: Response) {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const stored = await storeAttachment(req.file, 'tenders');
  res.json(await svc.addAttachment(req.params.id, stored.filename, stored.url));
}

export async function exportData(req: Request, res: Response) {
  const data = await svc.listForExport(req.query as never);
  res.json({ data });
}
