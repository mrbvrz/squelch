import React from 'react';
import ReactDOM from 'react-dom/client';
import { TrayPopoverApp } from './TrayPopoverApp';
import '../app/styles.css';

ReactDOM.createRoot(document.getElementById('tray-root') as HTMLElement).render(
  <React.StrictMode>
    <TrayPopoverApp />
  </React.StrictMode>
);
