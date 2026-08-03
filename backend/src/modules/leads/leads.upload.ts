import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../../common/AppError";

const dir = path.resolve(env.uploadDir);
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

export const quoteUpload = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new AppError(400, "INVALID_FILE_TYPE", "Only PDF files are accepted"));
      return;
    }
    cb(null, true);
  },
}).single("file");
