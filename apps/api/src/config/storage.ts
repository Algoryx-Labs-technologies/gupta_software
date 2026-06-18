import crypto from 'crypto';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

const endpoint =
  env.DO_SPACES_ENDPOINT ?? `https://${env.DO_SPACES_REGION}.digitaloceanspaces.com`;

export const s3Client = new S3Client({
  endpoint,
  region: env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: env.DO_SPACES_KEY,
    secretAccessKey: env.DO_SPACES_SECRET,
  },
  forcePathStyle: false,
});

function publicFileUrl(key: string): string {
  if (env.DO_SPACES_PUBLIC_URL) {
    return `${env.DO_SPACES_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://${env.DO_SPACES_BUCKET}.${env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;
}

export function buildObjectKey(folder: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.pdf';
  return `${folder}/${Date.now()}-${crypto.randomUUID()}${ext}`;
}

export function keyFromFileUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    if (!pathname) return null;

    if (env.DO_SPACES_PUBLIC_URL) {
      const base = new URL(env.DO_SPACES_PUBLIC_URL);
      if (parsed.origin === base.origin) return pathname;
    }

    const bucketHost = `${env.DO_SPACES_BUCKET}.${env.DO_SPACES_REGION}.digitaloceanspaces.com`;
    if (parsed.hostname === bucketHost) return pathname;

    return pathname;
  } catch {
    return null;
  }
}

export async function uploadFileToSpaces(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  );

  return publicFileUrl(key);
}

export async function deleteFileFromSpaces(url: string): Promise<void> {
  const key = keyFromFileUrl(url);
  if (!key) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.DO_SPACES_BUCKET,
      Key: key,
    }),
  );
}
