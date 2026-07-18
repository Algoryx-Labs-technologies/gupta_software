import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body.email, req.body.password, req);
  setRefreshCookie(res, result.refreshToken);
  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function adminLogin(req: Request, res: Response) {
  const result = await authService.adminLogin(req.body.id, req.body.password, req);
  setRefreshCookie(res, result.refreshToken);
  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE);
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.sub);
  res.json(user);
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError(401, 'Refresh token missing');
  }
  const accessToken = await authService.refreshAccessToken(token);
  res.json({ accessToken });
}
