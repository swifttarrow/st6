import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Dev harness uses client-side routes; with `build.lib` set, default appType can skip SPA fallback
  // and deep links (e.g. /executive) return real 404s from the dev server.
  appType: 'spa',
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin /api in dev avoids CORS (browser → :5173 → :8080).
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'WctFrontend',
      fileName: 'wct-frontend',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    cssCodeSplit: false,
  },
});
