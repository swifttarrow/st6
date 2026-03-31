import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'WctFrontend',
      fileName: 'wct-frontend',
      formats: ['es'],
    },
  },
});
