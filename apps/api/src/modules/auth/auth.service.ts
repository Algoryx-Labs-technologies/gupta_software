import bcrypt from 'bcryptjs';
import { Role } from '@gupta/shared';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken, signRefreshToken } from '../../utils/jwt.js';
import { logActivity } from '../../middleware/activityLogger.js';
import {
  validateAdminCredentials,
  getSystemAdminProfile,
  isSystemAdminSub,
  resolveCreatedByRef,
  SYSTEM_ADMIN_SUB,
} from '../../config/admin.js';
import type { Request } from 'express';
import type { CreateUserInput, UpdateUserInput } from '@gupta/shared';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

function issueTokens(sub: string, email: string, role: Role) {
  const payload = { sub, email, role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    payload,
  };
}

/** Team portal login — MongoDB users only (not admin). */
export async function login(email: string, password: string, req: Request) {
  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.role === Role.ADMIN) {
    throw new ApiError(403, 'Use admin login for administrator access');
  }

  if (user.disabled) {
    throw new ApiError(403, 'Account has been disabled');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = issueTokens(
    user._id.toString(),
    user.email,
    user.role,
  );

  await logActivity(user._id.toString(), 'login', 'Auth', user._id.toString(), undefined, req);

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/** Admin portal login — ID + password from apps/api/.env only. */
export async function adminLogin(id: string, password: string, req: Request) {
  const valid = await validateAdminCredentials(id, password);
  if (!valid) {
    throw new ApiError(401, 'Invalid admin ID or password');
  }

  const profile = getSystemAdminProfile();
  const { accessToken, refreshToken } = issueTokens(
    SYSTEM_ADMIN_SUB,
    profile.email,
    Role.ADMIN,
  );

  try {
    await logActivity(
      SYSTEM_ADMIN_SUB,
      'admin_login',
      'Auth',
      SYSTEM_ADMIN_SUB,
      { isSystemAdmin: true },
      req,
    );
  } catch (err) {
    console.error('Activity log failed (admin login still succeeded):', err);
  }

  return {
    accessToken,
    refreshToken,
    user: {
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      role: Role.ADMIN,
    },
  };
}

export async function getMe(userId: string) {
  if (isSystemAdminSub(userId)) {
    return getSystemAdminProfile();
  }

  const user = await UserModel.findById(userId).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function refreshAccessToken(refreshToken: string) {
  const { verifyRefreshToken } = await import('../../utils/jwt.js');
  const payload = verifyRefreshToken(refreshToken);

  if (isSystemAdminSub(payload.sub)) {
    return signAccessToken({
      sub: SYSTEM_ADMIN_SUB,
      email: payload.email,
      role: Role.ADMIN,
    });
  }

  const user = await UserModel.findById(payload.sub).select('email role disabled');

  if (!user || user.disabled) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  return signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });
}

export async function listUsers(page: number, limit: number, search?: string) {
  const { skip } = getPagination(page, limit);
  const filter: Record<string, unknown> = { role: { $ne: Role.ADMIN } };
  if (search) {
    filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  }

  const [data, total] = await Promise.all([
    UserModel.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createUser(input: CreateUserInput, createdBy: string) {
  const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new ApiError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role,
    passwordHash,
    createdBy: resolveCreatedByRef(createdBy),
  });

  const result = user.toObject();
  delete (result as { passwordHash?: string }).passwordHash;
  return result;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await UserModel.findById(id);
  if (!existing) throw new ApiError(404, 'User not found');

  if (existing.role === Role.ADMIN) {
    throw new ApiError(400, 'Cannot modify admin accounts from the team list');
  }

  const user = await UserModel.findByIdAndUpdate(
    id,
    { ...input, ...(input.email ? { email: input.email.toLowerCase() } : {}) },
    { new: true, runValidators: true },
  ).select('-passwordHash');

  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function updateUserStatus(id: string, disabled: boolean) {
  const user = await UserModel.findByIdAndUpdate(id, { disabled }, { new: true }).select(
    '-passwordHash',
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function resetUserPassword(id: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.findByIdAndUpdate(id, { passwordHash }, { new: true }).select(
    '-passwordHash',
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function getUserById(id: string) {
  const user = await UserModel.findById(id).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function deleteUser(id: string, requesterId: string) {
  if (requesterId === id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.role === Role.ADMIN) {
    throw new ApiError(400, 'Cannot delete admin accounts');
  }

  await UserModel.findByIdAndDelete(id);
  return { message: 'User deleted' };
}
