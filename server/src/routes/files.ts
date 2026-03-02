import { Router, Request, Response } from 'express';
import multer from 'multer';
import { setFile, getFile, deleteFile } from '../services/fileStore';

const router = Router();

const MAX_FILE_BYTES = (Number(process.env.MAX_FILE_MB) || 15) * 1024 * 1024;

// Store uploaded files in memory (they're short-lived encrypted blobs)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
});

// POST /upload — receive an encrypted PDF blob, return a session ID
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided. Use field name "file".' });
    return;
  }

  const sessionId = setFile(req.file.buffer);
  const ttlMinutes = Number(process.env.TTL_MINUTES) || 15;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  res.json({ sessionId, expiresAt });
});

// GET /file/:id — return the raw encrypted blob
router.get('/file/:id', (req: Request, res: Response) => {
  const file = getFile(req.params.id);

  if (!file) {
    res.status(404).json({ error: 'File not found or expired.' });
    return;
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="insurance.enc"');
  res.setHeader('Content-Length', file.buffer.length);
  res.send(file.buffer);
});

// DELETE /file/:id — early cleanup when the sender ends the session
router.delete('/file/:id', (req: Request, res: Response) => {
  deleteFile(req.params.id);
  res.status(204).send();
});

export default router;
