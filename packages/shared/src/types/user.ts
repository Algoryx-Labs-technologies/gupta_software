import type { Role } from '../enums.js';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  disabled: boolean;
  lastLoginAt?: string | Date;
  createdBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserPublic extends Omit<User, 'createdBy'> {}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
