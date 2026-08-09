import path from 'path';
import { ApiError } from './ApiError.js';
import {
  buildObjectKey,
  deleteFileFromSpaces,
  uploadFileToSpaces,
} from '../config/storage.js';

const PDF_MIME = 'application/pdf';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export async function storeAttachment(
  file: UploadedFile,
  folder: 'purchases' | 'tenders' | 'loas',
  options?: { pdfOnly?: boolean },
): Promise<{ filename: string; url: string }> {
  const ext = path.extname(file.originalname).toLowerCase();

  if (options?.pdfOnly && ext !== '.pdf') {
    throw new ApiError(400, 'Only PDF receipts are allowed');
  }

  const key = buildObjectKey(`attachments/${folder}`, file.originalname);
  const contentType = file.mimetype || (ext === '.pdf' ? PDF_MIME : 'application/octet-stream');

  const url = await uploadFileToSpaces(file.buffer, key, contentType);

  return { filename: file.originalname, url };
}

export async function removeStoredAttachment(url: string): Promise<void> {
  await deleteFileFromSpaces(url);
}
