import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { nativeImage, NativeImage } from 'electron';

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Generates a high-resolution macOS Sonoma/Sequoia style squircle application icon PNG.
 */
export function renderMacAppIconPng(size = 256): Buffer {
  const raw = Buffer.alloc(size * (size * 4 + 1), 0);
  const half = size / 2;
  // macOS Big Sur/Sonoma icon grid: 824/1024 (~80.5%) squircle body
  const boxHalf = size * 0.41;
  const cornerRadius = boxHalf * 0.45;

  const bars = [
    { xOffset: -0.44, halfHeight: 0.2 },
    { xOffset: -0.22, halfHeight: 0.38 },
    { xOffset: 0.0, halfHeight: 0.52 },
    { xOffset: 0.22, halfHeight: 0.38 },
    { xOffset: 0.44, halfHeight: 0.2 }
  ];
  const barThickness = boxHalf * 0.085;

  for (let py = 0; py < size; py++) {
    const rowStart = py * (size * 4 + 1);
    raw[rowStart] = 0; // filter 0

    const dyCenter = py + 0.5 - half;
    const normY = (py - (half - boxHalf)) / (boxHalf * 2);

    for (let px = 0; px < size; px++) {
      const dxCenter = px + 0.5 - half;

      // Signed distance to rounded squircle box
      const qx = Math.abs(dxCenter) - (boxHalf - cornerRadius);
      const qy = Math.abs(dyCenter) - (boxHalf - cornerRadius);
      const distSquircle =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        cornerRadius;

      const squircleAlpha = Math.max(0, Math.min(1, 0.5 - distSquircle));
      if (squircleAlpha <= 0) continue;

      // Rich macOS Azure -> Cobalt gradient + subtle radial glow
      const tGrad = Math.max(0, Math.min(1, normY));
      const radialGlow = Math.max(
        0,
        1 - Math.hypot(dxCenter, dyCenter - boxHalf * 0.3) / (boxHalf * 1.35)
      );

      let r = Math.round(14 + (0 - 14) * tGrad + radialGlow * 28);
      let g = Math.round(148 + (74 - 148) * tGrad + radialGlow * 36);
      let b = Math.round(255 + (218 - 255) * tGrad + radialGlow * 15);

      // Subtle inner specular rim on top edge of squircle
      if (distSquircle > -2.2 && dyCenter < 0) {
        const rim = Math.max(0, 1 - Math.abs(distSquircle + 1.0) / 1.2) * 0.35;
        r = Math.round(r + (255 - r) * rim);
        g = Math.round(g + (255 - g) * rim);
        b = Math.round(b + (255 - b) * rim);
      }

      // Subtle concentric broadcast ring inside squircle
      const centerDist = Math.hypot(dxCenter, dyCenter);
      const ringRadius = boxHalf * 0.74;
      const ringDist = Math.abs(centerDist - ringRadius) - size * 0.006;
      const ringCov = Math.max(0, Math.min(1, 0.5 - ringDist)) * 0.16;
      if (ringCov > 0) {
        r = Math.round(r + (255 - r) * ringCov);
        g = Math.round(g + (255 - g) * ringCov);
        b = Math.round(b + (255 - b) * ringCov);
      }

      // Crisp white 5-bar capsule waveform emblem in center
      let fgCov = 0;
      for (const bar of bars) {
        const bx = bar.xOffset * boxHalf;
        const bh = bar.halfHeight * boxHalf;
        const bdx = Math.abs(dxCenter - bx);
        const bdy = Math.max(0, Math.abs(dyCenter) - bh);
        const bDist = Math.hypot(bdx, bdy) - barThickness;
        const cov = Math.max(0, Math.min(1, 0.5 - bDist));
        if (cov > fgCov) fgCov = cov;
      }

      if (fgCov > 0) {
        r = Math.round(r + (255 - r) * fgCov);
        g = Math.round(g + (255 - g) * fgCov);
        b = Math.round(b + (255 - b) * fgCov);
      }

      const idx = rowStart + 1 + px * 4;
      raw[idx] = Math.max(0, Math.min(255, r));
      raw[idx + 1] = Math.max(0, Math.min(255, g));
      raw[idx + 2] = Math.max(0, Math.min(255, b));
      raw[idx + 3] = Math.round(squircleAlpha * 255);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

export function loadOrCreateMacAppIcon(resourcesDir?: string): NativeImage {
  if (resourcesDir) {
    const iconPath = path.join(resourcesDir, 'icons', 'app-icon.png');
    if (fs.existsSync(iconPath)) {
      return nativeImage.createFromPath(iconPath);
    }
  }
  const pngBuf = renderMacAppIconPng(256);
  return nativeImage.createFromBuffer(pngBuf);
}
