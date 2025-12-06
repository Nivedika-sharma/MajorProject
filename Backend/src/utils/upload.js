import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const provider = 'local'; // Force local provider

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOADS_DIR || './src/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: localStorage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Dummy S3 function so imports don't break controllers
async function uploadToS3() {
  throw new Error("S3 upload not enabled. Set FILE_UPLOAD_PROVIDER=s3 to enable.");
}

export { upload, uploadToS3, provider as uploadProvider };
