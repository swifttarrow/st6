/**
 * Vite dev entry — login + session, then full app (simulates PA host mounting the micro-frontend).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DevApp } from './DevApp';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app element');
}

createRoot(container).render(<DevApp />);
