import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
  ],
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
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
