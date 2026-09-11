import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const TEAL = [15, 118, 110, 255];
const TEAL_HOVER = [13, 148, 136, 255];
const SOFT = [204, 251, 241, 255];
const WHITE = [255, 255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(path, size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  const out = createWriteStream(path);
  out.end(png);
}

function inRoundRect(x, y, size, r) {
  const cx = Math.min(Math.max(x, r), size - 1 - r);
  const cy = Math.min(Math.max(y, r), size - 1 - r);
  if (x === cx || y === cy) return true;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function glyphBar(x, y, size, gx, gy, gw, gh) {
  const s = size / 32;
  return x >= gx * s && x < (gx + gw) * s && y >= gy * s && y < (gy + gh) * s;
}

function paint(x, y, size) {
  const r = Math.round(size * 0.22);
  if (!inRoundRect(x, y, size, r)) return [0, 0, 0, 0];

  const ny = y / size;
  if (ny > 0.78) return SOFT;
  if (ny > 0.68) {
    const wave = Math.sin((x / size) * Math.PI * 2.2) * 0.03;
    return ny > 0.72 + wave ? SOFT : TEAL_HOVER;
  }

  // T
  if (
    glyphBar(x, y, size, 7, 6.2, 8.2, 2.1) ||
    glyphBar(x, y, size, 9.6, 6.2, 2.4, 10.6)
  ) {
    return WHITE;
  }
  // L
  if (
    glyphBar(x, y, size, 17.2, 6.2, 2.4, 10.6) ||
    glyphBar(x, y, size, 17.2, 14.7, 7.4, 2.1)
  ) {
    return WHITE;
  }

  return TEAL;
}

for (const size of [192, 512]) {
  writePng(join(outDir, `icon-${size}.png`), size, paint);
}

console.log('wrote public/icons/icon-192.png and icon-512.png');
