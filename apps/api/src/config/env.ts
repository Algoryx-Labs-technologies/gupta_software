import path from 'path';
import dotenv from 'dotenv';

// apps/api/.env (two levels up from src/config)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z
    .string()
    .min(1)
    .transform((value) => value.trim().replace(/^["']|["']$/g, '')),
  MONGODB_DNS_SERVERS: z
    .string()
    .optional()
    .transform((value) => {
      if (!value?.trim()) return undefined;
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_LOGIN_ID: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  ADMIN_DISPLAY_NAME: z.string().default('System Admin'),
  DO_SPACES_KEY: z.string().min(1),
  DO_SPACES_SECRET: z.string().min(1),
  DO_SPACES_BUCKET: z.string().min(1),
  DO_SPACES_REGION: z.string().min(1),
  DO_SPACES_ENDPOINT: z.string().url().optional(),
  DO_SPACES_PUBLIC_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
