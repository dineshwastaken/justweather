import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api-imd': {
          target: 'https://mausam.imd.gov.in',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-imd/, ''),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://mausam.imd.gov.in/'
          },
          configure: (proxy) => {
            proxy.on('error', (err, req, res: any) => {
              if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'IMD server unreachable', message: err.message }));
              }
            });
          }
        },
        '/api-city': {
          target: 'http://city.imd.gov.in',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-city/, ''),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'http://city.imd.gov.in/'
          },
          configure: (proxy) => {
            proxy.on('error', (err, req, res: any) => {
              if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'IMD City server unreachable', message: err.message }));
              }
            });
          }
        }
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
