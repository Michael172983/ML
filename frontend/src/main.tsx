import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import App from './App';
import { LoveEarnApp } from './love/LoveEarnApp';

const path = window.location.pathname;
// Works under /ML/ (GitHub Pages) and / (local dev)
const RootApp = path.includes('/guardian') ? App : LoveEarnApp;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
