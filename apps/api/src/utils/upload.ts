import path from 'path';
import multer from 'multer';
import { ApiError } from './ApiError.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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
