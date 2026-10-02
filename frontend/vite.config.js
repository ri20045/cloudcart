import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    // Explicitly define empty postcss config to prevent Vite from traversing
    // parent directories looking for postcss config files
    postcss: {},
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
  }
});
