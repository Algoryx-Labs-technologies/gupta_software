import { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from './env.js';

/** Fixed JWT subject for env-based system admin (not stored in MongoDB). */
export const SYSTEM_ADMIN_SUB = 'system-admin';

export function getSystemAdminProfile() {
  return {
    _id: SYSTEM_ADMIN_SUB,
    name: env.ADMIN_DISPLAY_NAME,
    email: env.ADMIN_LOGIN_ID,
    role: 'admin' as const,
    disabled: false,
  };
}

export async function validateAdminCredentials(loginId: string, password: string): Promise<boolean> {
  const id = loginId.trim();
  const expectedId = env.ADMIN_LOGIN_ID.trim();

  if (id !== expectedId) {
    return false;
  }

  if (env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  }

  const a = Buffer.from(password);
  const b = Buffer.from(env.ADMIN_PASSWORD);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function isSystemAdminSub(sub: string): boolean {
  return sub === SYSTEM_ADMIN_SUB;
}

/** Maps JWT sub to a MongoDB User ref; env admin has no User document. */
export function resolveCreatedByRef(sub?: string): string | undefined {
  if (!sub || isSystemAdminSub(sub)) return undefined;
  return sub;
}
