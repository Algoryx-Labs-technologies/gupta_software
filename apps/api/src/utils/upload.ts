import path from 'path';
import multer from 'multer';
import { ApiError } from './ApiError.js';

/** Max upload size for LOA, purchase, and other attachments (20 MB). */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      cb(new ApiError(400, `File type not allowed: ${ext || 'unknown'}`));
      return;
    }
    cb(null, true);
  },
});
