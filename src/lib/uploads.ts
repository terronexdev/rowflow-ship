/**
 * Shared document upload helpers (parcel / project / permit).
 */
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { NOTE_CATEGORIES } from '@/lib/constants';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const ALLOWED_CATEGORIES = new Set(NOTE_CATEGORIES.map((c) => c.value));

export function isAllowedMimeType(mimeType: string) {
  return (
    ALLOWED_MIME_TYPES.has(mimeType) ||
    ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
  );
}

export function cleanFileName(fileName: string) {
  return (
    fileName
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'upload'
  );
}

export function inferDocumentType(mimeType: string, providedType?: string | null) {
  if (providedType) return providedType;
  if (mimeType.startsWith('image/')) return 'Photo';
  if (mimeType === 'application/pdf') return 'PDF';
  return 'Document';
}

export async function storeScopedFile(
  scope: 'parcels' | 'projects' | 'permits' | 'expenses',
  scopeId: string,
  file: File
) {
  const safeName = cleanFileName(file.name);
  const objectName = `rowflow/${scope}/${scopeId}/${randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(objectName, bytes, {
      access: 'public',
      contentType: file.type,
    });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', scope, scopeId);
  await mkdir(uploadDir, { recursive: true });
  const localName = `${randomUUID()}-${safeName}`;
  await writeFile(path.join(uploadDir, localName), bytes);
  return `/uploads/${scope}/${scopeId}/${localName}`;
}
