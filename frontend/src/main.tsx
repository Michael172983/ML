import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import App from './App';
import { LoveEarnApp } from './love/LoveEarnApp';

const path = window.location.pathname;
const RootApp = path.startsWith('/guardian') ? App : LoveEarnApp;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
