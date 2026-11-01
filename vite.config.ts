import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 1420,
    strictPort: true
  },
  build: {
    outDir: 'dist-ui',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        tray: path.resolve(__dirname, 'tray.html'),
        audio: path.resolve(__dirname, 'audio.html')
      }
    }
  }
});
