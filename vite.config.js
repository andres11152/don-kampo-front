import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Limitar el tamaño de los archivos a cachear a 5 MB
        globIgnores: ['assets/index-DUDElYX9.js', 'images/33.png'],
      },
      manifest: {
        name: 'Don Kampo',
        short_name: 'DK',
        description: 'Bienvenido a Don Kampo',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'images/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'images/icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    https: false,  // Desactiva HTTPS en desarrollo
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Usa HTTP en lugar de HTTPS para el backend local
        changeOrigin: true,
        secure: false, // Desactiva la verificación de certificado
      },
    },
  },  
  build: {
    chunkSizeWarningLimit: 1500, // Aumenta el límite del tamaño de chunk a 1500 KB
    outDir: 'dist', // Asegura que la salida se realice en la carpeta dist
    sourcemap: true, // Incluye mapas de fuente para depuración en producción
  },
});
