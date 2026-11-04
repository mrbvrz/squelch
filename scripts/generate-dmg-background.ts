import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Creates a smooth anti-aliased ribbon polygon along a quadratic bezier curve.
 */
function makeCurvedRibbon(
    x0: number,
    y0: number,
    cx: number,
    cy: number,
    x1: number,
    y1: number,
    width: number,
    steps = 40
): string {
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
        const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * (width / 2);
        const ny = (dx / len) * (width / 2);
        top.push(`${(x + nx).toFixed(1)},${(y + ny).toFixed(1)}`);
        bot.unshift(`${(x - nx).toFixed(1)},${(y - ny).toFixed(1)}`);
    }
    return [...top, ...bot].join(' ');
}

/**
 * Creates a thick line polygon with rounded caps.
 */
function makeThickLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number
): string {
    return makeCurvedRibbon(
        x1,
        y1,
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        x2,
        y2,
        width,
        6
    );
}

export function generateDmgBackgroundSvg(): string {
    // 1. Curved Arrow Stem (starts at X: 540, peaks at 665, ends at 780)
    const arrowStem = makeCurvedRibbon(540, 395, 665, 300, 780, 375, 7.5, 50);

    // 2. Open Hand-drawn Arrowhead Barbs (seamlessly meeting at 780, 375)
    const upperBarb = makeThickLine(782, 373, 735, 335, 7.5);
    const lowerBarb = makeThickLine(782, 377, 735, 400, 7.5);

    // 3. Excitement burst lines above Applications Folder (Center X: 960, Y: 220)
    const burstCenter = makeThickLine(960, 215, 960, 160, 6.5);
    const burstLeft = makeThickLine(920, 225, 885, 175, 6.5);
    const burstRight = makeThickLine(1000, 225, 1035, 175, 6.5);

    // 4. Squelch Radio Broadcast Waves (emitting from Squelch icon at X: 360, Y: 380)
    const wave1 = makeCurvedRibbon(495, 330, 525, 380, 495, 430, 5, 25);
    const wave2 = makeCurvedRibbon(520, 310, 555, 380, 520, 450, 4.5, 25);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 800" width="1320" height="800">
  <defs>
    <!-- Cursor drop shadow -->
    <filter id="cursorShadow" x="-30%" y="-30%" width="170%" height="170%">
      <feDropShadow dx="1" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.16" />
    </filter>

    <!-- Cursor polygon with tip at (0, 0) -->
    <g id="cursor">
      <polygon points="0,0 0,30 8,22 15,36 21,33 14,19 22,19"
               stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" />
    </g>
  </defs>

  <!-- Canvas Background: Pure Crisp Apple White -->
  <rect width="1320" height="800" fill="#FFFFFF" />

  <!-- Squelch Radio Waves (Subtle brand touch) -->
  <polygon points="${wave1}" fill="#6366F1" opacity="0.4" />
  <polygon points="${wave2}" fill="#06B6D4" opacity="0.3" />

  <!-- Central Curved Hand-drawn Arrow (Figma style) -->
  <polygon points="${arrowStem}" fill="#18181B" />
  <polygon points="${upperBarb}" fill="#18181B" />
  <polygon points="${lowerBarb}" fill="#18181B" />

  <!-- Excitement Burst Lines above Applications Folder -->
  <polygon points="${burstCenter}" fill="#18181B" />
  <polygon points="${burstLeft}" fill="#18181B" />
  <polygon points="${burstRight}" fill="#18181B" />

  <!-- Figma-style Multiplayer Cursors -->
  <!-- 1. Green Cursor (Top-left of App, pointing down-right toward App) -->
  <g transform="translate(240, 270) rotate(140) scale(1.15)" filter="url(#cursorShadow)" fill="#10B981">
    <use href="#cursor" />
  </g>

  <!-- 2. Purple Cursor (Bottom-left of App, pointing up-right toward App) -->
  <g transform="translate(235, 520) rotate(50) scale(1.15)" filter="url(#cursorShadow)" fill="#8B5CF6">
    <use href="#cursor" />
  </g>

  <!-- 3. Coral Red Cursor (Bottom-right of App, pointing up-left toward App) -->
  <g transform="translate(520, 490) rotate(-20) scale(1.15)" filter="url(#cursorShadow)" fill="#F43F5E">
    <use href="#cursor" />
  </g>

  <!-- 4. Black Cursor (Bottom-left of Applications folder, pointing into folder) -->
  <g transform="translate(835, 445) rotate(45) scale(1.15)" filter="url(#cursorShadow)" fill="#18181B">
    <use href="#cursor" />
  </g>
</svg>`;
}

async function main() {
    const iconsDir = path.resolve(__dirname, '../src-tauri/icons');
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const svgPath = path.join(iconsDir, 'dmg-background.svg');
    const pngPath = path.join(iconsDir, 'dmg-background.png');
    const png2xPath = path.join(iconsDir, 'dmg-background@2x.png');

    const svgContent = generateDmgBackgroundSvg();
    fs.writeFileSync(svgPath, svgContent, 'utf8');
    console.log(`✅ Saved SVG to ${svgPath}`);

    // Render 1320x800 @2x Retina PNG via ImageMagick
    try {
        execSync(`magick "${svgPath}" "${pngPath}"`);
        fs.copyFileSync(pngPath, png2xPath);
        console.log(`✅ Rendered 1320x800 Retina DMG background to ${pngPath}`);
    } catch (err) {
        console.error('Error rendering PNG with ImageMagick:', err);
    }
}

void main();
