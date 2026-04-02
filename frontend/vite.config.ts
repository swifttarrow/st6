import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const spa = process.env.BUILD_SPA === '1';

const sharedServer = {
  proxy: {
    '/api': {
      target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
      changeOrigin: true,
    },
  },
};

export default defineConfig(() => {
  if (spa) {
    return {
      appType: 'spa' as const,
      plugins: [react()],
      server: sharedServer,
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
    };
  }

  return {
    appType: 'spa',
    plugins: [react()],
    server: sharedServer,
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
  };
});
