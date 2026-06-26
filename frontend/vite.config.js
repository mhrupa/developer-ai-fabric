import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
});
