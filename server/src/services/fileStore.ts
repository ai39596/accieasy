import crypto from 'crypto';

interface StoredFile {
  buffer: Buffer;
  expiresAt: number;
}

const store = new Map<string, StoredFile>();

const TTL_MS = (Number(process.env.TTL_MINUTES) || 15) * 60 * 1000;

// Clean up expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, file] of store.entries()) {
    if (file.expiresAt < now) {
      store.delete(id);
    }
  }
}, 2 * 60 * 1000).unref();

export function setFile(buffer: Buffer): string {
  const sessionId = crypto.randomUUID();
  store.set(sessionId, {
    buffer,
    expiresAt: Date.now() + TTL_MS,
  });
  return sessionId;
}

export function getFile(sessionId: string): StoredFile | null {
  const file = store.get(sessionId);
  if (!file) return null;
  if (file.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  return file;
}

export function deleteFile(sessionId: string): boolean {
  return store.delete(sessionId);
}
