import React from 'react';
import ReactDOM from 'react-dom/client';
import { TrayPopoverApp } from './TrayPopoverApp';
import '../app/styles.css';
import { initTauriBridge } from '../bridge/tauri-bridge';

initTauriBridge();

ReactDOM.createRoot(document.getElementById('tray-root') as HTMLElement).render(
    <React.StrictMode>
        <TrayPopoverApp />
    </React.StrictMode>
);
