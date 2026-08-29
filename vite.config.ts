import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'import.meta.env.VITE_BUNNY_PULL_ZONE_URL': JSON.stringify(process.env.BUNNY_PULL_ZONE_URL || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
    },
    server: {
      allowedHosts: [
        'yoouz.com',
        'yoouz-app-ibzu44b5yq-ew.a.run.app',
        '.run.app',
        'localhost',
        '127.0.0.1'
      ],
      host: true,
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: [
        'yoouz.com',
        'yoouz-app-ibzu44b5yq-ew.a.run.app',
        '.run.app'
      ],
      host: true,
      cors: true,
    },
  };
});
