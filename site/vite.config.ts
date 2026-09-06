import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, '../dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        'demo/index': resolve(__dirname, 'demo/index.html'),
        'privacy/index': resolve(__dirname, 'privacy/index.html'),
        'terms/index': resolve(__dirname, 'terms/index.html'),
        '404': resolve(__dirname, '404.html')
      }
    }
  },
  test: {
    include: [resolve(__dirname, '**/*.test.ts')]
  }
});
