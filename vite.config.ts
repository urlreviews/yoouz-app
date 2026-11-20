import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'import.meta.env.VITE_BUNNY_PULL_ZONE_URL': JSON.stringify(process.env.BUNNY_PULL_ZONE_URL || ''),
      'import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID': JSON.stringify(process.env.BUNNY_STREAM_LIBRARY_ID || '733814')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'lucide-react'],
      exclude: ['pdfjs-dist', '@vladmandic/face-api'],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      emptyOutDir: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (id.includes('/country-state-city/')) {
              return 'vendor-geo-cities';
            }
            if (id.includes('/pdfjs-dist/')) {
              return 'vendor-pdf';
            }
            if (id.includes('/leaflet/')) {
              return 'vendor-leaflet';
            }
            if (id.includes('/motion/') || id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('/hls.js/')) {
              return 'vendor-hls';
            }
            if (id.includes('/@vladmandic/')) {
              return 'vendor-face';
            }
            if (id.includes('/qrcode.react/')) {
              return 'vendor-qr';
            }
          },
        },
      },
    },
    server: {
      allowedHosts: true as const,
      host: true,
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: true as const,
      host: true,
      cors: true,
    },
  };
});
