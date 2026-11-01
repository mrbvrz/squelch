import * as fs from 'fs';
import * as path from 'path';
import {
    renderTrayTemplatePng,
    TRAY_ANIMATION_FRAME_COUNT
} from '../src/platform/macos/tray-icon-generator';

const outDir = path.resolve(__dirname, '../src-tauri/icons/tray');
fs.mkdirSync(outDir, { recursive: true });

// Idle
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

console.log('✅ Generated 26 tray animation frames into src-tauri/icons/tray/');
