import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

// Allowed image magic bytes: JPEG, PNG, GIF, WebP
const IMAGE_SIGNATURES = [
  { bytes: [0xFF, 0xD8, 0xFF],             ext: '.jpg'  }, // JPEG
  { bytes: [0x89, 0x50, 0x4E, 0x47],       ext: '.png'  }, // PNG
  { bytes: [0x47, 0x49, 0x46],             ext: '.gif'  }, // GIF
  { bytes: [0x52, 0x49, 0x46, 0x46],       ext: '.webp' }, // WebP (RIFF header)
];

function detectImageType(buffer) {
  return IMAGE_SIGNATURES.find(sig =>
    sig.bytes.every((b, i) => buffer[i] === b)
  ) ?? null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    // First-pass: reject obviously wrong MIME types
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/uploads — returns { url: '/uploads/<filename>' }
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Second-pass: verify magic bytes match a known image format
  const buf = Buffer.alloc(8);
  const fd  = fs.openSync(req.file.path, 'r');
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);

  if (!detectImageType(buf)) {
    fs.unlinkSync(req.file.path); // delete the rejected file
    return res.status(400).json({ error: 'File content is not a recognised image format' });
  }

  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default router;
