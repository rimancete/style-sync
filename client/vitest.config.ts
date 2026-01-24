import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
      components: path.resolve(__dirname, './src/components'),
      hooks: path.resolve(__dirname, './src/hooks'),
      utils: path.resolve(__dirname, './src/utils'),
      store: path.resolve(__dirname, './src/store'),
      api: path.resolve(__dirname, './src/api'),
      interfaces: path.resolve(__dirname, './src/interfaces'),
      lib: path.resolve(__dirname, './src/lib'),
    },
  },
});
