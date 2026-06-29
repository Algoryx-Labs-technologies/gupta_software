import type { Request, Response } from 'express';
import * as usersService from './users.service.js';

export async function list(req: Request, res: Response) {
  const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
  const result = await usersService.listUsers(page, limit, search);
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const user = await usersService.createUser(req.body, req.user!.sub);
  res.status(201).json(user);
}

export async function getById(req: Request, res: Response) {
  const user = await usersService.getUserById(req.params.id);
  res.json(user);
}

export async function update(req: Request, res: Response) {
  const user = await usersService.updateUser(req.params.id, req.body);
  res.json(user);
}

export async function updateStatus(req: Request, res: Response) {
  const user = await usersService.updateUserStatus(req.params.id, req.body.disabled);
  res.json(user);
}

export async function resetPassword(req: Request, res: Response) {
  const user = await usersService.resetUserPassword(req.params.id, req.body.password);
  res.json(user);
}

export async function remove(req: Request, res: Response) {
  const result = await usersService.deleteUser(req.params.id, req.user!.sub);
  res.json(result);
}
