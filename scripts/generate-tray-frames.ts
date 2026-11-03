import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

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

export type TrayIconVisualState = 'idle' | 'playing' | 'buffering' | 'error';
export const TRAY_ANIMATION_FRAME_COUNT = 12;

/**
 * Generates an Apple macOS compliant Template PNG buffer.
 * macOS AppKit Template Images MUST have pure black RGB (#000000)
 * with the visual shape and anti-aliasing encoded entirely in the Alpha channel.
 * macOS then automatically tints it white in Dark Mode, dark gray in Light Mode,
 * and handles menu bar selection/highlight states.
 */
export function renderTrayTemplatePng(
    state: TrayIconVisualState,
    size: number,
    frame = 0
): Buffer {
    const raw = Buffer.alloc(size * (size * 4 + 1), 0);
    const scale = size / 18;

    for (let y = 0; y < size; y++) {
        raw[y * (size * 4 + 1)] = 0; // PNG filter type 0 (None)
    }

    const blendBlackPixel = (x: number, y: number, alpha: number) => {
        if (x < 0 || x >= size || y < 0 || y >= size || alpha <= 0) return;
        const rowStart = y * (size * 4 + 1);
        const idx = rowStart + 1 + x * 4;
        const clampedAlpha = Math.max(0, Math.min(255, Math.round(alpha)));
        raw[idx] = 0; // Pure Black R (Template Image requirement)
        raw[idx + 1] = 0; // Pure Black G
        raw[idx + 2] = 0; // Pure Black B
        raw[idx + 3] = Math.max(raw[idx + 3], clampedAlpha);
    };

    // 5 modern rounded-capsule audio waveform bars in an 18x18 coordinate space
    const barX = [3.4, 6.2, 9.0, 11.8, 14.6];
    const barRadius = 0.85;
    const centerY = 9.0;

    const t =
        ((frame % TRAY_ANIMATION_FRAME_COUNT) / TRAY_ANIMATION_FRAME_COUNT) *
        Math.PI *
        2;

    let barHalfHeights: number[];
    let barAlphas: number[];

    if (state === 'playing') {
        barHalfHeights = [
            1.1 + 3.0 * (0.5 + 0.5 * Math.sin(t + 0.0)),
            1.5 + 4.3 * (0.5 + 0.5 * Math.sin(t * 2 + 1.1)),
            2.0 + 4.6 * (0.5 + 0.5 * Math.sin(t + 2.4)),
            1.4 + 4.4 * (0.5 + 0.5 * Math.sin(t * 2 + 3.8)),
            1.1 + 3.1 * (0.5 + 0.5 * Math.sin(t + 5.1))
        ];
        barAlphas = [255, 255, 255, 255, 255];
    } else if (state === 'buffering') {
        barHalfHeights = barX.map((_, i) => {
            const wave = 0.5 + 0.5 * Math.sin(t - i * 0.95);
            return 1.1 + 3.2 * wave;
        });
        barAlphas = barX.map((_, i) => {
            const wave = 0.5 + 0.5 * Math.sin(t - i * 0.95);
            return 140 + 115 * wave;
        });
    } else if (state === 'error') {
        barHalfHeights = [1.0, 2.0, 0.8, 2.0, 1.0];
        barAlphas = [160, 160, 255, 160, 160];
    } else {
        // Calm symmetric waveform when idle / paused
        barHalfHeights = [1.3, 3.0, 4.8, 3.0, 1.3];
        barAlphas = [235, 235, 235, 235, 235];
    }

    // Signed Distance Field (SDF) rasterization with super-sampled anti-aliasing
    for (let py = 0; py < size; py++) {
        const uy = (py + 0.5) / scale;
        for (let px = 0; px < size; px++) {
            const ux = (px + 0.5) / scale;

            for (let i = 0; i < barX.length; i++) {
                const bx = barX[i];
                const hh = barHalfHeights[i];
                const dx = Math.abs(ux - bx);
                const dy = Math.max(0, Math.abs(uy - centerY) - hh);
                const dist = Math.hypot(dx, dy) - barRadius;
                const coverage = Math.max(0, Math.min(1, 0.5 - dist * scale));
                if (coverage > 0) {
                    blendBlackPixel(px, py, coverage * barAlphas[i]);
                }
            }
        }
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8; // 8-bit depth
    ihdr[9] = 6; // Color type 6 (RGBA)
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

const outDir = path.resolve(__dirname, '../src-tauri/icons/tray');
fs.mkdirSync(outDir, { recursive: true });

// Idle & Error
fs.writeFileSync(
    path.join(outDir, 'tray_idle.png'),
    renderTrayTemplatePng('idle', 36, 0)
);
fs.writeFileSync(
    path.join(outDir, 'tray_error.png'),
    renderTrayTemplatePng('error', 36, 0)
);

// Playing 12 frames
for (let i = 0; i < TRAY_ANIMATION_FRAME_COUNT; i++) {
    fs.writeFileSync(
        path.join(outDir, `tray_playing_${i}.png`),
        renderTrayTemplatePng('playing', 36, i)
    );
}

// Buffering 12 frames
for (let i = 0; i < TRAY_ANIMATION_FRAME_COUNT; i++) {
    fs.writeFileSync(
        path.join(outDir, `tray_buffering_${i}.png`),
        renderTrayTemplatePng('buffering', 36, i)
    );
}

console.log(
    '✅ Generated 26 pure black template tray animation frames into src-tauri/icons/tray/'
);
