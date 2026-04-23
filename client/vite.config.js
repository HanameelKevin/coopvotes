import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Fallback if 5173 is absolutely stuck, but try it first
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 10000, // 10s timeout
        proxyTimeout: 10000
      }
    }
  }
});
