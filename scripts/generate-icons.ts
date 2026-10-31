import * as fs from 'fs';
import * as path from 'path';
import {
    renderTrayTemplatePng,
    TrayIconVisualState
} from '../src/platform/macos/tray-icon-generator';
import { renderMacAppIconPng } from '../src/platform/macos/app-icon-generator';

const outDir = path.resolve(__dirname, '../resources/icons');
fs.mkdirSync(outDir, { recursive: true });

const states: TrayIconVisualState[] = ['idle', 'playing', 'buffering', 'error'];

for (const state of states) {
    const png1x = renderTrayTemplatePng(state, 18);
    const png2x = renderTrayTemplatePng(state, 36);
    fs.writeFileSync(path.join(outDir, `tray-${state}Template.png`), png1x);
    fs.writeFileSync(path.join(outDir, `tray-${state}Template@2x.png`), png2x);
}

const appIcon512 = renderMacAppIconPng(512);
fs.writeFileSync(path.join(outDir, 'app-icon.png'), appIcon512);

console.log(
    `Generated ${states.length * 2} tray icons + 512x512 macOS app-icon.png in ${outDir}`
);
